 pipeline {
  agent any


  environment {
    SONARQUBE_ENV = 'sonarqube'

    REGISTRY = "192.168.215.181:5000"
    TAG = "build-${BUILD_NUMBER}"

    BE_IMAGE = "${REGISTRY}/test-web/backend:${TAG}"
    FE_IMAGE = "${REGISTRY}/test-web/frontend:${TAG}"

    SWARM_HOST = "192.168.215.181"
    SWARM_USER = "registry"
    STACK_FILE = "/opt/stacks/test-web/stack.yml"
    STACK_NAME = "test-web"
  }
  

  stages {
    stage('Checkout') {
      steps {
        // Lấy source code từ SCM (Git) về workspace của Jenkins
        checkout scm
      }
    }

    stage('Verify Node') {
      steps {
        sh '''
          uname -m
          node -v
          npm -v
          which node
          which npm
        '''
      }
    }

    stage('Install dependencies') {
      parallel {
        stage('Backend npm ci') {
          steps {
            dir('backend') {
              sh 'npm ci'
            }
          }
        }
        stage('Frontend npm ci') {
          steps {
            dir('frontend') {
              sh 'npm ci'
            }
          }
        }
      }
    }

    stage('ESLint') {
      parallel {
        stage('Lint backend') {
          steps {
            dir('backend') {
              sh 'npm run lint:ci || true'
            }
          }
        }

        stage('Lint frontend') {
          steps {
            dir('frontend') {
              sh 'npm run lint:ci || true'
            }
          }
        }
      }
    }

    stage('Publish ESLint reports') {
      steps {
        recordIssues(
          id: 'eslint-backend',
          name: 'ESLint Backend',
          tools: [checkStyle(pattern: 'backend/eslint-checkstyle.xml')]
        )

        recordIssues(
          id: 'eslint-frontend',
          name: 'ESLint Frontend',
          tools: [checkStyle(pattern: 'frontend/eslint-checkstyle.xml')]
        )
      }
    }


    stage('Secret scan - Gitleaks (Docker)') {
      steps {
        sh '''
          set -eux

          echo "======================================"
          echo "[GITLEAKS] Current working directory:"
          pwd
          echo "======================================"

          echo "[GITLEAKS] Listing top-level files:"
          ls -lah

          echo "======================================"
          echo "[GITLEAKS] Running scan on directory:"
          echo "SOURCE = $(pwd)"
          echo "======================================"

          docker run --rm \
            -v "$PWD:/repo" \
            -w /repo \
            zricethezav/gitleaks:latest \
            detect \
              --source . \
              --report-format json \
              --report-path gitleaks-report.json \
              --exit-code 1
        '''
      }
      post {
        always {
          archiveArtifacts artifacts: 'gitleaks-report.json', allowEmptyArchive: true
        }
      }
    }

    
    stage('SonarQube analysis') {
      steps {
        script {
          def scannerHome = tool 'SonarQubeScanner'   // đúng với tên Tool ở Manage Jenkins -> Tools
          withSonarQubeEnv('SonarQube Server') {      // PHẢI đúng tên ở Manage Jenkins -> System
            sh """
              set -euxo pipefail
              echo "[SONAR] pwd: \$(pwd)"
              ls -la

              ${scannerHome}/bin/sonar-scanner -X
            """
          }
        }
      }
    }



    stage("Quality Gate") {
      steps {
        timeout(time: 1, unit: 'HOURS') {
          waitForQualityGate abortPipeline: true
        }
      }
    }


    stage('Build Images') {
      parallel {
        stage('Build Backend') {
          steps {
            dir('backend') {
              sh '''
                set -euxo pipefail
                docker build -t "$BE_IMAGE" .
              '''
            }
          }
        }
        stage('Build Frontend') {
          steps {
            dir('frontend') {
              sh '''
                set -euxo pipefail
                docker build -t "$FE_IMAGE" .
              '''
            }
          }
        }
      }
    }


    stage('Trivy FS Scan') {
      steps {
        sh '''
          set -euxo pipefail
          mkdir -p "$WORKSPACE/trivy-reports"

          docker run --rm \
            -v "$WORKSPACE:/workspace" \
            -v "$WORKSPACE/.trivycache:/root/.cache/" \
            aquasec/trivy:latest \
            fs --scanners vuln,secret --format table \
            -o /workspace/trivy-reports/fs-report.txt \
            /workspace
         '''
      }
      post {
        always { archiveArtifacts artifacts: 'trivy-reports/*', fingerprint: true }
      }
    }


    stage('Trivy Image Scan') {
      parallel {

        stage('Trivy Scan Backend Image') {
          steps {
            sh '''
              set -euxo pipefail
              mkdir -p "$WORKSPACE/trivy-reports"

              trivy image \
                --scanners vuln \
                --severity HIGH,CRITICAL \
                --format table \
                -o "$WORKSPACE/trivy-reports/backend-image-report.txt" \
                pnkhanh211/test-web-backend:latest
            '''
          }
        }

        stage('Trivy Scan Frontend Image') {
          steps {
            sh '''
              set -euxo pipefail
              mkdir -p "$WORKSPACE/trivy-reports"

              trivy image \
                --scanners vuln \
                --severity HIGH,CRITICAL \
                --format table \
                -o "$WORKSPACE/trivy-reports/frontend-image-report.txt" \
                pnkhanh211/test-web-frontend:latest
            '''
          }
        }
      }
    }

    stage('Push Images to Private Registry') {
      steps {
        sh '''
          set -euxo pipefail
          docker push "$BE_IMAGE"
          docker push "$FE_IMAGE"
        '''
      }
    }


    stage('Test SSH') {
      steps {
        sshagent(credentials: ['swarm-node']) {
          sh 'ssh -o StrictHostKeyChecking=no registry@192.168.215.181 "whoami && hostname"'
        }
      }
    }



    stage('Deploy to Swarm (remote)') {
      steps {
        sshagent(credentials: ['swarm-node']) {
          sh '''
            set -euxo pipefail

            ssh -o StrictHostKeyChecking=no registry@192.168.215.181 << 'EOF'
              set -euxo pipefail
              docker node ls
              export IMAGE_TAG=build-${BUILD_NUMBER}
              docker stack deploy -c /opt/stacks/test-web/stack.yml test-web
              docker stack services test-web
            EOF
          '''
        }
      }
    }



  }
}
