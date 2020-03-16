
release:
	@npm run release
	@npm run postrelease
	@echo "\033[0;32mBUILD SUCCEEDED"

build:
	@npm run build

compress: build
	@npm run postrelease

clean:
	@npm run clean

coverage:
	@npm run coverage

test: build
	@npm run test

.PHONY: clean test coverage