//
// 1. Create a random binary input file: dd if=/dev/urandom of=inputfile.bin bs=2048 count=1000
// 2. Run through stdin: node test-stdin.js < ./data/inputfile.bin
// 3. Compare: diff ./data/inputfile.bin outputfile.bin
// 4. Verify no differences
//

require('fs').writeFileSync( './data/outputdata.bin', require('../lib/stdin').readSync(), { encoding: 'binary' } );

