pipeline {
  agent any


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
              sh 'npm ci'
              sh 'npm run lint:ci || true'
            }
          }
          post {
            always {
              recordIssues tools: [checkStyle(pattern: 'backend/eslint-checkstyle.xml')]
            }
          }
        }

        stage('Lint frontend') {
          steps {
            dir('frontend') {
              sh 'npm ci'
              sh 'npm run lint:ci || true'
            }
          }
          post {
            always {
              recordIssues tools: [checkStyle(pattern: 'frontend/eslint-checkstyle.xml')]
            }
          }
        }
      }
    }

    stage('Publish ESLint reports') {
      steps {
        // Lưu report như artifact để tải về
        archiveArtifacts artifacts: '**/eslint-checkstyle.xml', fingerprint: true

        // Nếu bạn cài plugin "Warnings Next Generation" thì bật dòng dưới để Jenkins đọc file và show lỗi theo file/line
        recordIssues enabledForFailure: true, tool: checkStyle(pattern: '**/eslint-checkstyle.xml')
      }
    }
  }
}
