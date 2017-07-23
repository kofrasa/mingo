
# configuration
MODULE = mingo
VERSION = $(shell cat VERSION)
YEAR = $(shell date +%Y)
BANNER = templates/header.txt

# tools
NODE_MODULES = ./node_modules
ROLLUP = ${NODE_MODULES}/rollup/bin/rollup
UGLIFY = ${NODE_MODULES}/uglify-js/bin/uglifyjs


all: clean test build


build: build.es6 compile compress bower.json package.json
	@echo "\033[0;32mBUILD SUCCEEDED"


build.es6:
	@${ROLLUP} -c config/rollup.es.js


compile:
	@sed -E -i .bak "s/VERSION = '.{1,}'/VERSION = '${VERSION}'/" lib/index.js && rm lib/index.js.bak


compress: mingo.js
	@cat ${BANNER} | sed "s/@VERSION/${VERSION}/" | sed "s/@YEAR/${YEAR}/" > dist/${MODULE}.min.js
	@${UGLIFY} dist/${MODULE}.js --compress --mangle --source-map dist/${MODULE}.map >> dist/${MODULE}.min.js
	@gzip -kf dist/${MODULE}.min.js


clean:
	@rm -fr dist/*
	@rm -f bower.json
	@rm -f package.json


mingo.js:
	@${ROLLUP} -c config/rollup.umd.js


test: mingo.js
	@tape test/*.js


%.json: templates/%.json.txt
	@cat $< | sed "s/@VERSION/${VERSION}/" > $@


.PHONY: clean test build
