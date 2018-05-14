#!/bin/bash

OUT=shaders.js

cd shader

printf "{\n" >> ../$OUT

for filename in *.vert; do
	shaderName=${filename%.*}

	if [ ! "$shaderName" == "editor" ]; then
		printf "  '$shaderName': {\n" >> ../$OUT
		printf "    'vert': '" >> ../$OUT
		cat $shaderName.vert | grep -v '//' | tr -d '\r\n\t' >> ../$OUT
		printf "',\n    'frag': '" >> ../$OUT
		cat $shaderName.frag | grep -v '//' | tr -d '\r\n\t' >> ../$OUT
		printf "'},\n" >> ../$OUT
	fi
done

printf "};" >> ../$OUT

cd ..
