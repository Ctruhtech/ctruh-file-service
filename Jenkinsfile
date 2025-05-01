pipeline {
    environment {
    registry = "ctruh.azurecr.io/backend/ctruh-file-service"
    containername = "ctruh-file-service"
    http_port = "9003"
    running_port = "9003"
    registryCredential = 'acrid'
    dockerImage = ''
    }

    agent { label params.Environment }
    stages {
            stage('Cloning our Git') {
                steps {
                git branch: params.branch , url: 'git@github.com:Ctruhtech/ctruh-file-service.git'
                }
            }
	     stage('set Environment File') {
                steps {
		    script {
                    	writeFile file: 'envfile', text: "${params.EnvVariables}"
                    	writeFile file: './env', text: "${params.EnvVariables}"
                    }
                }
            }
            stage ('Image Prune') { 
		steps {
                	imagePrune(containername)
                	echo "Image prune is complete"
		}
            }
            stage('Building Docker Image') {
                steps {
                    script {
                        sh "whoami"
                        dockerImage = docker.build(registry+":v1.$BUILD_NUMBER", "-f Dockerfile .")
                    }
                }
            }

            stage('upload Docker Image to Azure Container Registry') {
                steps {
                    script {
                        docker.withRegistry('https://ctruh.azurecr.io', registryCredential) {
                        dockerImage.push()
			dockerImage.push('latest')
                        }
                    }
                }
            }
        
            stage('Deploy Container') {
	    	steps {
                	runApp(containername, http_port, running_port)
                	echo "$containername deployement complete"
		}
            }
//            stage('Cleaning Up') {
//                steps{
//                  sh "docker rmi --force $registry:v1.$BUILD_NUMBER"
//                }
//            }
        }
    }

def imagePrune(containerName){
    try {
        sh "docker image prune -f"
        sh "docker stop $containerName"
    } catch(error){}
}

def runApp(containerName, httpPort, running_port){
	sh "docker run --rm -d -p $httpPort:$running_port --name $containerName --env-file ./envfile $registry:v1.$BUILD_NUMBER"
	echo "Application started on port: ${httpPort} (http)"
}
