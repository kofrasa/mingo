
# configuration
MODULE = mingo
YEAR = $(shell date +%Y)
VERSION = $(shell cat VERSION)

# tools
NODE_MODULES = ./node_modules
BABEL = ${NODE_MODULES}/babel-cli/bin/babel.js
ROLLUP = ${NODE_MODULES}/rollup/bin/rollup
UGLIFYJS = ${NODE_MODULES}/uglify-js/bin/uglifyjs

# sources
HEADER_FILE = build/header.template
SRC_DIR = lib
SRC_INDEX = ${SRC_DIR}/index.js
TARGET = umd


all: clean mingo.js test build bower.json package.json


test: mingo.js
	@tape test/*.js


clean:
	@rm -fr dist/*
	@rm -f *.json mingo.js


build: mingo.js
	@mkdir -p dist/
	@${UGLIFYJS} ${MODULE}.js --compress --mangle -o dist/${MODULE}.min.js --source-map dist/${MODULE}.min.map
	@gzip -kf dist/${MODULE}.min.js
	@echo "\033[0;32mBUILD SUCCEEDED"


mingo.js: $(shell find ${SRC_DIR})
	@cat ${HEADER_FILE} | sed "s/@YEAR/${YEAR}/" > ${MODULE}.js
	@${ROLLUP} ${SRC_INDEX} -f ${TARGET} -n ${MODULE} | ${BABEL} --presets=es2015 | sed "s/@VERSION/${VERSION}/" >> ${MODULE}.js


%.json: build/%.json.template
	@cat $< | sed "s/@VERSION/${VERSION}/" > $@


.PHONY: clean test build
