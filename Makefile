build:
	go build -o bin/chat ./

run: clean build
	./bin/chat	

clean:
	rm -rf ./bin/chat

bash:
	bash certgen.bash

