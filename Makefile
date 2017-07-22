
# configuration
MODULE = mingo
VERSION = $(shell cat VERSION)

# tools
NODE_MODULES = ./node_modules
BABEL = ${NODE_MODULES}/babel-cli/bin/babel.js
ROLLUP = ${NODE_MODULES}/rollup/bin/rollup
UGLIFY = ${NODE_MODULES}/uglify-js/bin/uglifyjs


all: clean build test compress bower.json package.json


build: version build.es6 build.umd
	@echo "\033[0;32mBUILD SUCCEEDED"
	@reset


build.es6: version
	@${ROLLUP} -c config/rollup.es6.js


build.umd: version
	@${ROLLUP} -c config/rollup.umd.js


compress:
	@${UGLIFY} dist/${MODULE}.js --compress --mangle --output dist/${MODULE}.min.js --source-map dist/${MODULE}.min.map
	@gzip -kf dist/${MODULE}.min.js


clean:
	@rm -fr dist/*


test:
	@tape test/*.js


version: lib/index.js
	@sed -E -i .bak "s/VERSION \s*= \s*'.{1,}'/VERSION = '${VERSION}'/" lib/index.js && rm lib/index.js.bak


%.json: template/%.json.txt
	@cat $< | sed "s/@VERSION/${VERSION}/" > $@


.PHONY: clean test build
