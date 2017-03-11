
SRC = lib/common.js \
	lib/polyfill.js \
	lib/util.js \
	lib/internal.js \
	lib/aggregator.js \
	lib/cursor.js \
	lib/query.js \
	lib/operators/group.js \
	lib/operators/pipeline.js \
	lib/operators/projection.js \
	lib/operators/query.js \
	lib/operators/aggregation/arithmetic.js \
	lib/operators/aggregation/array.js \
	lib/operators/aggregation/boolean.js \
	lib/operators/aggregation/comparison.js \
	lib/operators/aggregation/conditional.js \
	lib/operators/aggregation/date.js \
	lib/operators/aggregation/literal.js \
	lib/operators/aggregation/set.js \
	lib/operators/aggregation/string.js \
	lib/operators/aggregation/variable.js \
	lib/operators/aggregation/index.js \
	lib/operators/index.js \
	lib/index.js

YEAR = $(shell date +%Y)
VERSION = $(shell cat VERSION)
UGLIFYJS ?= ./node_modules/.bin/uglifyjs

all: clean mingo.js test build bower.json package.json

test:
	@tape test/*.js

clean:
	@rm -fr dist/*
	@rm -f *.json mingo.js

build: mingo.js
	@mkdir -p dist/
	@${UGLIFYJS} $< --compress --mangle -o dist/mingo.min.js --source-map dist/mingo.min.map
	@gzip -kf dist/mingo.min.js
	@echo "\033[0;32mBUILD SUCCEEDED"

mingo.js: $(SRC)
	@cat build/wrapper_begin $^ build/wrapper_end | \
	sed "s/@YEAR/${YEAR}/" | \
	sed "s/@VERSION/${VERSION}/" > $@

%.json: build/%.json.template
	@cat $< | sed "s/@VERSION/${VERSION}/" > $@

.PHONY: clean test build
