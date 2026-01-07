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


    stage('Secret scan - Gitleaks (remote repo url)') {
      environment {
        REPO_URL = 'https://github.com/Sotatek-KhanhPhung/Node_React_CRUD.git'
      }
      steps {
        sh '''
          set -euo pipefail
          echo "[GITLEAKS] Will scan remote repo: ${REPO_URL}"

          docker run --rm \
            -e REPO_URL="$REPO_URL" \
            -v "$PWD:/out" -w /out \
            zricethezav/gitleaks:latest sh -lc '
              set -euo pipefail
              echo "[GITLEAKS] container pwd: $(pwd)"
              echo "[GITLEAKS] cloning to /tmp/repo ..."
              rm -rf /tmp/repo
              git clone --quiet "$REPO_URL" /tmp/repo

              echo "[GITLEAKS] repo cloned, now scanning..."
              cd /tmp/repo
              echo "[GITLEAKS] scanning directory: $(pwd)"
              git log -1 --oneline || true

              gitleaks detect \
                --source . \
                --log-opts="--all" \
                --report-format json \
                --report-path /out/gitleaks-report.json \
                --exit-code 1
            '
        '''
      }
      post {
        always {
          archiveArtifacts artifacts: 'gitleaks-report.json', allowEmptyArchive: true
        }
      }
    }


  }
}
