"""Exhaustive circular atlas. Exact small primes; probable primes above 2**64.
All source digits are preserved, including leading zeroes. Zero-based source
loci; CW increments the source index, CCW decrements it. 1 is separately
recorded as a Moss symbolic gate and is never labelled mathematically prime.
"""
import collections, functools, hashlib, json, math, os, pathlib, re, time, gzip

ROOT = pathlib.Path(__file__).resolve().parent
REPO = pathlib.Path(os.environ.get('METAPET_REPO', ROOT.parents[1]))
SOURCE = (REPO/'src/lib/moss60/strandSequences.ts').read_text()
STRANDS = {k.lower():v for k,v in re.findall(r'MOSS_(RED|BLACK|BLUE)_STRAND =\s*"(\d+)"', SOURCE)}
STRANDS['lukus'] = '213471897639'
SMALL_PRIMES = [n for n in range(2,200) if all(n%d for d in range(2, math.isqrt(n)+1))]

@functools.lru_cache(maxsize=None)
def prime(n):
    if n < 2: return False
    for p in SMALL_PRIMES:
        if n == p: return True
        if n % p == 0: return False
    if n < 100_000_000:
        return all(n%d for d in range(201, math.isqrt(n)+1,2))
    d, s = n-1,0
    while d%2 == 0: d//=2; s+=1
    # Proven deterministic witness set below 2**64. For larger values use
    # 32 reproducible hash-derived bases and report only probable primality.
    bases = [2,325,9375,28178,450775,9780504,1795265022] if n < 2**64 else [
        2 + int.from_bytes(hashlib.sha256(f'{n}:{i}:moss60-audit'.encode()).digest(),'big') % (n-3) for i in range(32)]
    for a in bases:
        a%=n
        if a<2:continue
        x=pow(a,d,n)
        if x in (1,n-1):continue
        for _ in range(s-1):
            x=x*x%n
            if x==n-1:break
        else:return False
    return True

def window(s,start,width,direction):
    return ''.join(s[(start+direction*j)%len(s)] for j in range(width))

def main():
    flags={}
    for key,s in STRANDS.items():
        codes=[]
        for width in range(1,len(s)+1):
            for direction in (1,-1):
                for start in range(len(s)):
                    w=window(s,start,width,direction); n=int(w)
                    code=(1 if n<2**64 else 2) if prime(n) else 0
                    codes.append(str(code+4*(w==w[::-1])))
        flags[key]=''.join(codes)
    target=REPO/'src/lib/moss60/lab/canonical-atlas.json'
    existing=json.loads(target.read_text())
    assert sum(map(len,flags.values()))==21888
    assert existing['flags']==flags, 'Canonical atlas is stale; review new canonical strands and version the atlas before replacing it'
    print('Verified all 21,888 canonical atlas flags against the current source.')

if __name__=='__main__':main()
