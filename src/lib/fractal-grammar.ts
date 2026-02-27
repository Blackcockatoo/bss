/**
 * Fractal DNA Grammar — L-System Production Rules from Genome
 *
 * Transforms each DNA digit into a production rule in a Lindenmayer system.
 * The genome becomes a *generative grammar* — a set of instructions that
 * recursively rewrite themselves to produce fractal branching structures.
 *
 * How it works:
 *   1. Each DNA digit 0-6 maps to a rewriting rule  (axiom → expansion)
 *   2. The L-system iterates N generations, each rewrite expanding the string
 *   3. The final string is interpreted as a 3D turtle-graphics program
 *   4. The turtle traces out a fractal scaffold in 3D space
 *   5. Branch points become lattice nodes; segments become edges
 *
 * This produces genuinely unique fractal trees for every genome — not just
 * parameter variation on a fixed template, but structurally different
 * branching topologies.
 *
 * DNA mapping (base-7 digits → rules):
 *   0: F → F         (identity — straight growth)
 *   1: F → F[+F]     (branch right)
 *   2: F → F[-F]     (branch left)
 *   3: F → F[+F][-F] (bilateral fork)
 *   4: F → FF        (elongation — double segment)
 *   5: F → F[+F]F    (right branch with continuation)
 *   6: F → F[&F][^F] (3D branching — pitch up/down)
 *
 * Turtle commands:
 *   F  = move forward and draw
 *   +  = yaw right  (rotate around Y)
 *   -  = yaw left
 *   &  = pitch down (rotate around X)
 *   ^  = pitch up
 *   /  = roll CW    (rotate around Z)
 *   \  = roll CCW
 *   [  = push state (branch start)
 *   ]  = pop state  (branch end)
 */

import { type Vec3, v3, v3add, v3scale, v3norm, v3len, v3dist } from './lattice-math';

// ── Types ────────────────────────────────────────────────────────────────────
export interface FractalNode {
  pos:        Vec3;
  depth:      number;       // branch depth (0 = trunk)
  generation: number;       // L-system generation that produced this
  dnaDigit:   number;       // originating DNA digit
  parent:     number;       // parent node index (-1 for root)
}

export interface FractalEdge {
  a: number;
  b: number;
  depth: number;            // branch depth of this segment
}

export interface FractalTree {
  nodes: FractalNode[];
  edges: FractalEdge[];
  maxDepth: number;
  ruleSignature: string;    // compact representation of the active ruleset
}

export interface FractalGrammarConfig {
  generations:  number;     // L-system iteration count (2-5)
  segmentLen:   number;     // forward step size
  branchAngle:  number;     // base angle for +/- (radians)
  pitchAngle:   number;     // base angle for &/^ (radians)
  rollAngle:    number;     // base angle for / and \ (radians)
  lengthDecay:  number;     // segment shrink factor per branch depth (0.6-0.9)
  maxNodes:     number;     // safety cap
}

// ── Production rules ─────────────────────────────────────────────────────────
//
// Each DNA digit selects a production rule.  The rules are designed so that
// different digit distributions create structurally distinct fractal families:
//   - 0-heavy DNA → long straight chains (minimal branching)
//   - 3-heavy DNA → dense bilateral forks (bushy)
//   - 6-heavy DNA → 3D spiralling trees
//   - mixed DNA   → complex asymmetric structures

const PRODUCTION_RULES: Record<number, string> = {
  0: 'F',             // identity (straight)
  1: 'F[+F]',         // right branch
  2: 'F[-F]',         // left branch
  3: 'F[+F][-F]',     // bilateral fork
  4: 'FF',            // elongation
  5: 'F[+F]F',        // branch-continue
  6: 'F[&F][^F]',     // 3D pitch branching
};

/**
 * Build a position-dependent production ruleset from a DNA string.
 *
 * Instead of one global rule, each position in the L-string can use a
 * different production based on the DNA digit at (position mod dnaLength).
 * This makes the fractal structure encode the *sequence* of the genome,
 * not just its digit distribution.
 */
function buildRuleset(dna: string): (pos: number) => string {
  const digits = dna.split('').map(d => Math.min(6, Math.max(0, parseInt(d, 10) || 0)));
  return (pos: number) => PRODUCTION_RULES[digits[pos % digits.length]];
}

/**
 * Run the L-system for the given number of generations.
 * Returns the final instruction string.
 */
function iterate(axiom: string, ruleAt: (pos: number) => string, generations: number, maxLen: number): string {
  let current = axiom;
  let posCounter = 0;

  for (let gen = 0; gen < generations; gen++) {
    let next = '';
    for (const ch of current) {
      if (ch === 'F') {
        const expansion = ruleAt(posCounter++);
        next += expansion;
      } else {
        next += ch;
      }
      if (next.length > maxLen) break;
    }
    current = next;
    if (current.length > maxLen) {
      current = current.slice(0, maxLen);
      break;
    }
  }

  return current;
}

// ── 3D Turtle interpreter ────────────────────────────────────────────────────

interface TurtleState {
  pos:     Vec3;
  heading: Vec3;    // forward direction
  left:    Vec3;    // left direction
  up:      Vec3;    // up direction
  depth:   number;
}

function rotateTurtle(
  heading: Vec3, left: Vec3, up: Vec3,
  axis: 'yaw' | 'pitch' | 'roll',
  angle: number,
): { heading: Vec3; left: Vec3; up: Vec3 } {
  const c = Math.cos(angle), s = Math.sin(angle);

  switch (axis) {
    case 'yaw': // rotate heading & left around up
      return {
        heading: v3add(v3scale(heading, c), v3scale(left, s)),
        left:    v3add(v3scale(left, c), v3scale(heading, -s)),
        up,
      };
    case 'pitch': // rotate heading & up around left
      return {
        heading: v3add(v3scale(heading, c), v3scale(up, s)),
        left,
        up:      v3add(v3scale(up, c), v3scale(heading, -s)),
      };
    case 'roll': // rotate left & up around heading
      return {
        heading,
        left: v3add(v3scale(left, c), v3scale(up, s)),
        up:   v3add(v3scale(up, c), v3scale(left, -s)),
      };
  }
}

/**
 * Interpret an L-system string as a 3D turtle-graphics program.
 * Returns the fractal tree (nodes + edges).
 */
function interpretTurtle(
  instructions: string,
  config: FractalGrammarConfig,
  dna: string,
): FractalTree {
  const digits = dna.split('').map(d => Math.min(6, parseInt(d, 10) || 0));

  const nodes: FractalNode[] = [];
  const edges: FractalEdge[] = [];

  // Seed node at origin
  const rootState: TurtleState = {
    pos:     v3(0, 0, 0),
    heading: v3(0, 1, 0),   // grow upward
    left:    v3(-1, 0, 0),
    up:      v3(0, 0, 1),
    depth:   0,
  };

  nodes.push({
    pos: rootState.pos,
    depth: 0,
    generation: 0,
    dnaDigit: digits[0],
    parent: -1,
  });

  let turtle = { ...rootState };
  const stack: { state: TurtleState; nodeIdx: number }[] = [];
  let currentNodeIdx = 0;
  let maxDepth = 0;
  let fCounter = 0;

  for (const ch of instructions) {
    if (nodes.length >= config.maxNodes) break;

    const segLen = config.segmentLen * Math.pow(config.lengthDecay, turtle.depth);

    switch (ch) {
      case 'F': {
        const newPos = v3add(turtle.pos, v3scale(turtle.heading, segLen));
        const newIdx = nodes.length;
        const digit = digits[fCounter % digits.length];
        fCounter++;

        nodes.push({
          pos: newPos,
          depth: turtle.depth,
          generation: turtle.depth,
          dnaDigit: digit,
          parent: currentNodeIdx,
        });

        edges.push({
          a: currentNodeIdx,
          b: newIdx,
          depth: turtle.depth,
        });

        turtle.pos = newPos;
        currentNodeIdx = newIdx;
        break;
      }
      case '+': {
        const r = rotateTurtle(turtle.heading, turtle.left, turtle.up, 'yaw', config.branchAngle);
        turtle.heading = r.heading; turtle.left = r.left; turtle.up = r.up;
        break;
      }
      case '-': {
        const r = rotateTurtle(turtle.heading, turtle.left, turtle.up, 'yaw', -config.branchAngle);
        turtle.heading = r.heading; turtle.left = r.left; turtle.up = r.up;
        break;
      }
      case '&': {
        const r = rotateTurtle(turtle.heading, turtle.left, turtle.up, 'pitch', config.pitchAngle);
        turtle.heading = r.heading; turtle.left = r.left; turtle.up = r.up;
        break;
      }
      case '^': {
        const r = rotateTurtle(turtle.heading, turtle.left, turtle.up, 'pitch', -config.pitchAngle);
        turtle.heading = r.heading; turtle.left = r.left; turtle.up = r.up;
        break;
      }
      case '/': {
        const r = rotateTurtle(turtle.heading, turtle.left, turtle.up, 'roll', config.rollAngle);
        turtle.heading = r.heading; turtle.left = r.left; turtle.up = r.up;
        break;
      }
      case '\\': {
        const r = rotateTurtle(turtle.heading, turtle.left, turtle.up, 'roll', -config.rollAngle);
        turtle.heading = r.heading; turtle.left = r.left; turtle.up = r.up;
        break;
      }
      case '[': {
        stack.push({
          state: { ...turtle },
          nodeIdx: currentNodeIdx,
        });
        turtle.depth++;
        if (turtle.depth > maxDepth) maxDepth = turtle.depth;
        break;
      }
      case ']': {
        const saved = stack.pop();
        if (saved) {
          turtle = { ...saved.state };
          currentNodeIdx = saved.nodeIdx;
        }
        break;
      }
    }
  }

  // Build rule signature (compact hash of which rules are active)
  const ruleSignature = digits.slice(0, 10).join('');

  return { nodes, edges, maxDepth, ruleSignature };
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Derive fractal grammar configuration from DNA.
 * Digits 10-19 control the fractal parameters.
 */
export function deriveFractalConfig(dna: string): FractalGrammarConfig {
  const d = dna.split('').map(d => Math.min(6, parseInt(d, 10) || 0));

  // Digits 10-14: generation count (2-4)
  const genSum = (d[10] || 0) + (d[11] || 0);
  const generations = 2 + Math.floor((genSum / 12) * 2.99);

  // Digits 15-19: branching angle (20-55 degrees)
  const angleSum = (d[15] || 0) + (d[16] || 0) + (d[17] || 0);
  const branchAngle = (20 + (angleSum / 18) * 35) * (Math.PI / 180);

  // Digit 18: pitch angle
  const pitchAngle = (15 + ((d[18] || 0) / 6) * 40) * (Math.PI / 180);

  // Digit 19: roll angle
  const rollAngle = (10 + ((d[19] || 0) / 6) * 30) * (Math.PI / 180);

  // Digit 20: length decay
  const lengthDecay = 0.6 + ((d[20] || 3) / 6) * 0.3;

  return {
    generations,
    segmentLen: 0.8,
    branchAngle,
    pitchAngle,
    rollAngle,
    lengthDecay,
    maxNodes: 300,
  };
}

/**
 * Generate a fractal tree from a DNA string.
 *
 * This is the main entry point.  It:
 *   1. Derives L-system parameters from DNA digits 10-20
 *   2. Builds position-dependent production rules from all DNA digits
 *   3. Runs the L-system for N generations
 *   4. Interprets the result as a 3D fractal tree
 */
export function generateFractalTree(dna: string): FractalTree {
  const config = deriveFractalConfig(dna);
  const ruleAt = buildRuleset(dna);
  const maxLen = config.maxNodes * 6; // rough instruction-to-node ratio

  const instructions = iterate('F', ruleAt, config.generations, maxLen);
  return interpretTurtle(instructions, config, dna);
}

/**
 * Merge a fractal tree into existing lattice node/edge arrays.
 *
 * The fractal tree provides *additional* growth sites beyond the Bravais
 * lattice blueprint — organic branches that extend the crystal into
 * biologically-inspired fractal territory.
 *
 * Returns the offset applied to fractal node indices (for edge remapping).
 */
export function mergeFractalIntoLattice(
  tree: FractalTree,
  existingNodeCount: number,
): { nodes: FractalNode[]; edges: FractalEdge[]; offset: number } {
  const offset = existingNodeCount;
  const nodes = tree.nodes.map(n => ({ ...n }));
  const edges = tree.edges.map(e => ({
    ...e,
    a: e.a + offset,
    b: e.b + offset,
  }));
  return { nodes, edges, offset };
}
