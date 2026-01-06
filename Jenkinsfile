pipeline {
  agent any

  tools {
    // Dùng NodeJS đã cấu hình trong Jenkins (Manage Jenkins → Global Tool Configuration)
    // Bạn đặt tên tool là gì thì để đúng tên đó ở đây.
    nodejs 'node-22'
  }

  stages {
    stage('Debug node/npm') {
      steps {
        sh '''
        echo "USER=$(whoami)"
        echo "SHELL=$SHELL"
        echo "PATH=$PATH"
        command -v node || true
        command -v npm || true
        which node || true
        which npm || true
        node -v || true
        npm -v || true
        '''
      }
    }

    stage('Checkout') {
      steps {
        // Lấy source code từ SCM (Git) về workspace của Jenkins
        checkout scm
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
              // Chạy lint và xuất report checkstyle xml
              sh 'npm run lint:ci'
            }
          }
        }
        stage('Lint frontend') {
          steps {
            dir('frontend') {
              sh 'npm run lint:ci'
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
