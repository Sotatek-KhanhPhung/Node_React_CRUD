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

    stage('TruffleHog') {
      steps {
        echo 'Running TruffleHog scan ...'
        // Run TruffleHog scan on the checked-out repository
        sh 'trufflehog git https://github.com/ScaleSec/vulnado.git --json --no-update > trufflehog-results.json'
        // Optionally, you can archive the results
        archiveArtifacts artifacts: 'trufflehog-results.json', allowEmptyArchive: true
        // Read and print results to console
        script {
            def truffleHogResults = readFile('trufflehog-results.json')
            echo "TruffleHog Scan Results: ${truffleHogResults}"
        }
      }
    }

  }
}
