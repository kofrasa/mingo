
release:
	@npm run release
	@echo "\033[0;32mBUILD SUCCEEDED"

build:
	@npm run build

clean:
	@npm run clean

coverage:
	@npm run coverage

test:
	@npm run test

.PHONY: clean test coverage