/**
 * Worked Examples of Element Number Theory
 * Demonstrates all coordinates and transformations for specific elements
 */

import {
  generateElementProfile,
  to60Adic,
  factorRelativeTo60,
  toHeptaTriple,
  encodeUnit,
  buildResidueNodes,
  analyzeJewbleElements,
  formatElementProfile,
} from './engine';

/**
 * WORKED EXAMPLE: Residue 1 (H/Pm Pair)
 *
 * This demonstrates the "bridge" structure where two elements
 * share the same residue mod 60 but live on different tiers.
 *
 * Hydrogen (Z=1) and Promethium (Z=61) both map to residue a=1,
 * creating a vertical connection from classical to frontier chemistry.
 */
export function workedExampleResidue1() {
  console.log('='.repeat(80));
  console.log('WORKED EXAMPLE: Residue 1 (Hydrogen/Promethium Bridge)');
  console.log('='.repeat(80));
  console.log();

  // ============================================================================
  // HYDROGEN (Z=1)
  // ============================================================================

  const hydrogen = generateElementProfile(1);

  console.log('HYDROGEN (H, Z=1) - The Primordial Element');
  console.log('-'.repeat(80));
  console.log();

  // 60-adic coordinates
  console.log('1. 60-adic Coordinates:');
  console.log(`   Z = a + 60b`);
  console.log(`   1 = ${hydrogen.sixtyAdic.a} + 60×${hydrogen.sixtyAdic.b}`);
  console.log(`   → Position: a = ${hydrogen.sixtyAdic.a} (first position on circle)`);
  console.log(`   → Tier: b = ${hydrogen.sixtyAdic.b} (lower shell, classical)`);
  console.log();

  // Factorization relative to 60
  console.log('2. Factorization relative to 60:');
  console.log(`   Z = 2^α × 3^β × 5^γ × u`);
  const h = hydrogen.factors;
  console.log(`   1 = 2^${h.alpha} × 3^${h.beta} × 5^${h.gamma} × ${h.u}`);
  console.log(`   → "Mantle" (2,3,5 content): (${h.alpha}, ${h.beta}, ${h.gamma})`);
  console.log(`   → "Core" (unit mod 60): u = ${h.u}`);
  console.log(
    `   → Unit code (4-bit): ${hydrogen.unitCode.code} (binary: ${hydrogen.unitCode.code.toString(2).padStart(4, '0')})`
  );
  console.log(
    `   → Interpretation: Pure unity, no base-60 factors - the multiplicative identity`
  );
  console.log();

  // HeptaMath (base-7 triple)
  console.log('3. HeptaMath (base-7 triple):');
  console.log(`   Z = d0 + 7×d1 + 49×d2`);
  console.log(
    `   1 = ${hydrogen.hepta.d0} + 7×${hydrogen.hepta.d1} + 49×${hydrogen.hepta.d2}`
  );
  console.log(`   → Hepta triple: (${hydrogen.hepta.d0}, ${hydrogen.hepta.d1}, ${hydrogen.hepta.d2})`);
  console.log(`   → Rhythmic interpretation:`);
  console.log(`     - d0 = ${hydrogen.hepta.d0}: single-beat pulse`);
  console.log(`     - d1 = ${hydrogen.hepta.d1}: no septimal subdivision`);
  console.log(`     - d2 = ${hydrogen.hepta.d2}: ground tier`);
  console.log();

  // Classification
  console.log('4. Classification:');
  console.log(`   → Frontier element: ${hydrogen.isFrontier ? 'YES' : 'NO'} (Z ≤ 82)`);
  console.log(`   → Synthetic: ${hydrogen.isSynthetic ? 'YES' : 'NO'} (Z < 93)`);
  console.log(`   → Superheavy: ${hydrogen.isSuperheavy ? 'YES' : 'NO'} (Z < 104)`);
  console.log();

  // ============================================================================
  // PROMETHIUM (Z=61)
  // ============================================================================

  const promethium = generateElementProfile(61);

  console.log('PROMETHIUM (Pm, Z=61) - The Radioactive Lanthanide');
  console.log('-'.repeat(80));
  console.log();

  // 60-adic coordinates
  console.log('1. 60-adic Coordinates:');
  console.log(`   Z = a + 60b`);
  console.log(`   61 = ${promethium.sixtyAdic.a} + 60×${promethium.sixtyAdic.b}`);
  console.log(`   → Position: a = ${promethium.sixtyAdic.a} (SAME position as H!)`);
  console.log(`   → Tier: b = ${promethium.sixtyAdic.b} (upper shell, one tier up)`);
  console.log();

  // Factorization relative to 60
  console.log('2. Factorization relative to 60:');
  console.log(`   Z = 2^α × 3^β × 5^γ × u`);
  const p = promethium.factors;
  console.log(`   61 = 2^${p.alpha} × 3^${p.beta} × 5^${p.gamma} × ${p.u}`);
  console.log(`   → "Mantle" (2,3,5 content): (${p.alpha}, ${p.beta}, ${p.gamma})`);
  console.log(`   → "Core" (unit mod 60): u = ${p.u}`);
  console.log(
    `   → Unit code (4-bit): ${promethium.unitCode.code} (binary: ${promethium.unitCode.code.toString(2).padStart(4, '0')})`
  );
  console.log(
    `   → Interpretation: Prime number, coprime to 60, carries no base-60 factors`
  );
  console.log();

  // HeptaMath (base-7 triple)
  console.log('3. HeptaMath (base-7 triple):');
  console.log(`   Z = d0 + 7×d1 + 49×d2`);
  console.log(
    `   61 = ${promethium.hepta.d0} + 7×${promethium.hepta.d1} + 49×${promethium.hepta.d2}`
  );
  console.log(`   → Hepta triple: (${promethium.hepta.d0}, ${promethium.hepta.d1}, ${promethium.hepta.d2})`);
  console.log(`   → Rhythmic interpretation:`);
  console.log(`     - d0 = ${promethium.hepta.d0}: five-beat pulse`);
  console.log(`     - d1 = ${promethium.hepta.d1}: septimal layer 1`);
  console.log(`     - d2 = ${promethium.hepta.d2}: first elevated tier`);
  console.log();

  // Classification
  console.log('4. Classification:');
  console.log(`   → Frontier element: ${promethium.isFrontier ? 'YES' : 'NO'} (Z > 82, radioactive)`);
  console.log(`   → Synthetic: ${promethium.isSynthetic ? 'YES' : 'NO'} (naturally occurring, trace)`);
  console.log(`   → Superheavy: ${promethium.isSuperheavy ? 'YES' : 'NO'} (Z < 104)`);
  console.log();

  // ============================================================================
  // BRIDGE ANALYSIS
  // ============================================================================

  console.log('BRIDGE ANALYSIS: H/Pm Connection');
  console.log('-'.repeat(80));
  console.log();

  console.log('1. Shared Residue:');
  console.log(`   Both elements map to a = 1 (mod 60)`);
  console.log(`   → This creates a "vertical bridge" connecting two tiers`);
  console.log(`   → Delta: Δ = ${promethium.z} - ${hydrogen.z} = ${promethium.z - hydrogen.z} = 60 exactly`);
  console.log();

  console.log('2. Tier Structure:');
  console.log(`   H:  b = ${hydrogen.sixtyAdic.b} (ground tier - abundant, stable, fundamental)`);
  console.log(`   Pm: b = ${promethium.sixtyAdic.b} (first tier - rare, radioactive, lanthanide)`);
  console.log(`   → Center of mass: b̄ = (0 + 1) / 2 = 0.5`);
  console.log();

  console.log('3. Factorization Comparison:');
  console.log(`   H:  2^${h.alpha} × 3^${h.beta} × 5^${h.gamma} × ${h.u} (pure identity)`);
  console.log(`   Pm: 2^${p.alpha} × 3^${p.beta} × 5^${p.gamma} × ${p.u} (pure prime)`);
  console.log(`   → Charge vector difference: (Δα, Δβ, Δγ) = (${p.alpha - h.alpha}, ${p.beta - h.beta}, ${p.gamma - h.gamma})`);
  console.log(`   → Pm adds no 2,3,5 structure compared to H - both are "unit-like"`);
  console.log();

  console.log('4. HeptaMath Comparison:');
  console.log(`   H:  (${hydrogen.hepta.d0}, ${hydrogen.hepta.d1}, ${hydrogen.hepta.d2}) = pure singularity in base-7`);
  console.log(`   Pm: (${promethium.hepta.d0}, ${promethium.hepta.d1}, ${promethium.hepta.d2})`);
  console.log(`   → Vector sum: (${hydrogen.hepta.d0 + promethium.hepta.d0}, ${hydrogen.hepta.d1 + promethium.hepta.d1}, ${hydrogen.hepta.d2 + promethium.hepta.d2})`);
  console.log(`   → Mod 7: (${(hydrogen.hepta.d0 + promethium.hepta.d0) % 7}, ${(hydrogen.hepta.d1 + promethium.hepta.d1) % 7}, ${(hydrogen.hepta.d2 + promethium.hepta.d2) % 7})`);
  console.log();

  console.log('5. Element Algebra (conceptual):');
  console.log(`   If we define "reaction" as multiplication mod 60:`);
  console.log(`   H × Pm ≡ ${hydrogen.z} × ${promethium.z} (mod 60)`);
  console.log(`         ≡ ${(hydrogen.z * promethium.z) % 60} (mod 60)`);
  const productElement = (hydrogen.z * promethium.z) % 60;
  console.log(`   → This maps to residue a = ${productElement}`);

  // Find element at that residue if any
  const nodes = buildResidueNodes();
  const productNode = nodes.find((n) => n.a === productElement);
  if (productNode && productNode.elements.length > 0) {
    console.log(`   → Elements at residue ${productElement}:`);
    for (const elem of productNode.elements) {
      console.log(`     - ${elem.symbol} (Z=${elem.z})`);
    }
  } else {
    console.log(`   → No element exists at residue ${productElement}`);
  }
  console.log();

  console.log('6. Bridge Type:');
  console.log(`   Residue 1 is a "bridge" node (B(1) = 2)`);
  console.log(`   → Connects classical chemistry (H) to frontier (Pm)`);
  console.log(`   → Symbolically: origin ↔ lanthanide mystery`);
  console.log();

  console.log('='.repeat(80));
  console.log();

  return { hydrogen, promethium };
}

/**
 * Example: Analyze a simple Jewble genome
 */
export function exampleJewbleAnalysis() {
  console.log('='.repeat(80));
  console.log('EXAMPLE: Jewble Element Analysis');
  console.log('='.repeat(80));
  console.log();

  // Example genome: simple sequences focusing on small digits
  const red60 = Array(60).fill(0).map((_, i) => (i % 10));
  const blue60 = Array(60).fill(0).map((_, i) => ((i * 3) % 10));
  const black60 = Array(60).fill(0).map((_, i) => ((i * 7) % 10));

  console.log('Genome (pattern):');
  console.log(`  RED:   ${red60.slice(0, 20).join('')}...`);
  console.log(`  BLUE:  ${blue60.slice(0, 20).join('')}...`);
  console.log(`  BLACK: ${black60.slice(0, 20).join('')}...`);
  console.log();

  const analysis = analyzeJewbleElements(red60, blue60, black60);

  console.log('Element Analysis:');
  console.log('-'.repeat(80));
  console.log();

  console.log(`1. Residues Hit: ${analysis.residuesHit.length} unique positions`);
  console.log(`   ${analysis.residuesHit.join(', ')}`);
  console.log();

  console.log(`2. Elements Hit: ${analysis.elementsHit.length} total elements`);
  console.log(`   (${new Set(analysis.elementsHit.map(e => e.symbol)).size} unique)`);
  const symbolCounts = new Map<string, number>();
  for (const elem of analysis.elementsHit) {
    symbolCounts.set(elem.symbol, (symbolCounts.get(elem.symbol) || 0) + 1);
  }
  const topElements = Array.from(symbolCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  console.log(`   Top elements:`);
  for (const [sym, count] of topElements) {
    const elem = analysis.elementsHit.find(e => e.symbol === sym);
    console.log(`     ${sym} (Z=${elem?.z}): appears ${count}x`);
  }
  console.log();

  console.log(`3. Bridge Score: ${analysis.bridgeScore}`);
  console.log(`   (Sum of B(a) values for all hit residues)`);
  console.log();

  console.log(`4. Frontier Weight: ${analysis.frontierWeight}`);
  console.log(`   (Number of frontier elements, Z > 82)`);
  console.log();

  console.log(`5. Charge Vector (2-3-5 exponents):`);
  console.log(`   C₂ = ${analysis.chargeVector.c2} (total power of 2)`);
  console.log(`   C₃ = ${analysis.chargeVector.c3} (total power of 3)`);
  console.log(`   C₅ = ${analysis.chargeVector.c5} (total power of 5)`);
  console.log(`   → This could modulate frequency ratios or prime seeding`);
  console.log();

  console.log(`6. Hepta Signature (base-7 sums mod 7):`);
  console.log(`   H₀ = ${analysis.heptaSignature.h0}`);
  console.log(`   H₁ = ${analysis.heptaSignature.h1}`);
  console.log(`   H₂ = ${analysis.heptaSignature.h2}`);
  console.log(`   → Triple: (${analysis.heptaSignature.h0}, ${analysis.heptaSignature.h1}, ${analysis.heptaSignature.h2})`);
  console.log();

  console.log(`7. Average Tier: ${analysis.averageTier.toFixed(3)}`);
  console.log(`   → ${analysis.averageTier < 0.3 ? 'Grounded in classical chemistry' : analysis.averageTier > 0.7 ? 'Pulled towards frontier/superheavy' : 'Balanced between tiers'}`);
  console.log();

  console.log('8. Element Wave F_J(θ):');
  console.log(`   Sample at θ = 0°: ${JSON.stringify(analysis.elementWave(0))}`);
  console.log(`   Sample at θ = 90°: ${JSON.stringify(analysis.elementWave(Math.PI / 2))}`);
  console.log(`   Sample at θ = 180°: ${JSON.stringify(analysis.elementWave(Math.PI))}`);
  console.log(`   → This wave can drive radial envelopes for sacred geometry rendering`);
  console.log();

  console.log('='.repeat(80));
  console.log();

  return analysis;
}

/**
 * Run all examples
 */
export function runAllExamples() {
  workedExampleResidue1();
  console.log('\n\n');
  exampleJewbleAnalysis();
}
