
# configuration
MODULE = mingo
VERSION = $(shell cat VERSION)

# tools
NODE_MODULES = ./node_modules
BABEL = ${NODE_MODULES}/babel-cli/bin/babel.js
ROLLUP = ${NODE_MODULES}/rollup/bin/rollup
UGLIFY = ${NODE_MODULES}/uglify-js/bin/uglifyjs


all: clean test build


build: build.es6 compress version bower.json package.json
	@echo "\033[0;32mBUILD SUCCEEDED"


build.es6:
	@${ROLLUP} -c config/rollup.es6.js


compress: mingo.js
	@${UGLIFY} dist/${MODULE}.js --compress --mangle --output dist/${MODULE}.min.js --source-map dist/${MODULE}.min.map
	@gzip -kf dist/${MODULE}.min.js


clean:
	@rm -fr dist/*
	@rm -f bower.json
	@rm -f package.json


mingo.js:
	@${ROLLUP} -c config/rollup.umd.js


test: mingo.js
	@tape test/*.js


version: lib/index.js
	@sed -E -i .bak "s/VERSION \s*= \s*'.{1,}'/VERSION = '${VERSION}'/" lib/index.js && rm lib/index.js.bak


%.json: template/%.json.txt
	@cat $< | sed "s/@VERSION/${VERSION}/" > $@


.PHONY: clean test build
