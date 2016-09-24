
all: clean test build

test:
	@tape test/*.js

clean:
	@rm -fr dist/*

build:
	@mkdir -p dist/
	@uglifyjs mingo.js -c -m -o dist/mingo.min.js --source-map dist/mingo.min.map
	@gzip -kf dist/mingo.min.js
	@echo "\033[0;32mBUILD SUCCEEDED"

.PHONY: clean test build
