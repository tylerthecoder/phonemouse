DOCKER_USERNAME="tylerthecoder"
IMAGE_NAME="phone-mouse"
TAG="latest"

# Build the Docker image
echo "Building Docker image..."
docker build -t $DOCKER_USERNAME/$IMAGE_NAME:$TAG -f ./Dockerfile .

# Push the image to Docker Hub
echo "Pushing image to Docker Hub..."
docker push $DOCKER_USERNAME/$IMAGE_NAME:$TAG
echo "Build and push completed successfully!"
