
# configuration
MODULE = mingo
VERSION = $(shell cat VERSION)
YEAR = $(shell date +%Y)
BANNER = templates/header.txt
TEST_FILES = $(shell find test -name "*.js")

# tools
CODECOV = node_modules/.bin/codecov
NYC = node_modules/.bin/nyc
ROLLUP = node_modules/.bin/rollup
TAPE = node_modules/.bin/tape
UGLIFY = node_modules/.bin/uglifyjs

# tasks
all: clean test build


build: prepare build.es6 compress bower.json package.json
	@echo "\033[0;32mBUILD SUCCEEDED"


build.es6:
	@${ROLLUP} -c config/rollup.es.js


prepare:
	@sed -E -i .bak "s/VERSION = '.{1,}'/VERSION = '${VERSION}'/" lib/index.js && rm lib/index.js.bak


compress: mingo.js
	@cat ${BANNER} | sed "s/@VERSION/${VERSION}/" | sed "s/@YEAR/${YEAR}/" > dist/${MODULE}.min.js
	@${UGLIFY} dist/${MODULE}.js --compress --mangle --source-map dist/${MODULE}.min.map >> dist/${MODULE}.min.js
	@gzip -kf dist/${MODULE}.min.js


clean:
	@rm -fr dist/*
	@rm -f bower.json
	@rm -f package.json


coverage:
	${NYC} report --reporter=text-lcov > coverage.lcov && ${CODECOV}


mingo.js:
	${ROLLUP} -c config/rollup.umd.js


test: mingo.js
	@${NYC} --reporter=lcov --reporter=text ${TAPE} ${TEST_FILES}


%.json: templates/%.json.txt
	@cat $< | sed "s/@VERSION/${VERSION}/" > $@


.PHONY: clean test build coverage
