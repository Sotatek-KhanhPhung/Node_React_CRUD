pipeline {
  agent any


  environment {
    SONARQUBE_ENV = 'sonarqube'
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
              // npm ci: cài dependency đúng theo package-lock (ổn định và nhanh cho CI)
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

    stage('Trivy FS Scan') {
      steps {
        sh 'set -eux'
        sh 'sudo chmod -R u+w .'
        sh 'trivy fs --format table -o fs-report.html .'
      }
    }
    
    stage('Build Image) {
      parallel {
        stage('Build-Tag & Push Backend Docker Image') {
          steps {
            script {
              withDockerRegistry(credentialsId: 'docker-cred') {
                dir('backend') {
                  sh 'docker build -t pnkhanh211/backend:latest .'
                  sh 'trivy image --format table -o backend-image-report.html pnkhanh211/backend:latest '
                  sh 'docker push pnkhanh211/backend:latest'
                }
              }
            }
          }
        }
            
        stage('Build-Tag & Push Frontend Docker Image') {
          steps {
            script {
              withDockerRegistry(credentialsId: 'docker-cred') {
                dir('frontend') {
                  sh 'docker build -t pnkhanh211/frontend:latest .'
                  sh 'trivy image --format table -o frontend-image-report.html pnkhanh211/frontend:latest '
                  sh 'docker push pnkhanh211/frontend:latest'
                }
              }
            }
          }
        }    
      }
    }

  }
}
