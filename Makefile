
release:
	@npm run release
	@echo "\033[0;32mBUILD SUCCEEDED"

build:
	@npm run build

compile:
	@npm run compile

compress: build
	@npm run postrelease

clean:
	@npm run clean

coverage:
	@npm run coverage

test: compile
	@npm run test

.PHONY: clean test coverage