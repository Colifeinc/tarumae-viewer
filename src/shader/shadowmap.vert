
attribute vec3 vertexPosition;
attribute vec3 normalPosition;

uniform mat4 projectionMatrix;

varying float depth;

void main(void) {
    vec4 position = projectionMatrix * vec4(vertexPosition, 1.0);

    depth = 0.5 + (position.z / position.w) * 0.5;

    gl_Position = position;
}
