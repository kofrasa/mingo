#!/bin/bash

# declare the tests to run. all tests by default
if [ $# -eq 0 ]; then
  TESTS="test/*.js test/**/*.js"
else
  TESTS="$*"
fi

# define the temporary main test script
FILE=testmain.js

# register cleanup
trap "rm -f ${FILE}" EXIT

# create test script
> $FILE cat <<-eof
import test from 'tape'
import path  from 'path'

test.createStream().pipe(process.stdout)

process.argv.slice(2).forEach(function (file) {
  require(path.resolve(file))
})
eof

# execute test with esm
node -r esm -r './lib/init/system' ${FILE} ${TESTS}