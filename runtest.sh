#!/bin/bash

# declare the tests to run. all tests by default
if [ $# -eq 0 ]; then
  TESTS="test/*.ts test/**/*.ts"
else
  TESTS="$*"
fi

# define the temporary main test script
FILE=testmain.ts

# register cleanup
trap "rm -f ${FILE}" EXIT

# create test script
> $FILE cat <<-eof
import * as tape from 'tape'
import * as path from 'path'

tape.createStream().pipe(process.stdout)

process.argv.slice(2).forEach(function (file) {
  require(path.resolve(file))
})
eof

# execute test with esm
ts-node ${FILE} ${TESTS}