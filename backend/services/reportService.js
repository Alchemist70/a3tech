/**
 * Lab Report Generation Service
 * Generates HTML and PDF reports for lab results
 */

const fs = require('fs');
const path = require('path');

/**
 * Generate HTML report content
 */
const generateHTMLReport = (labResult, lab) => {
  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formatTime = (date) => new Date(date).toLocaleTimeString('en-US');

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lab Report - ${lab.title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
        }
        
        .container {
            max-width: 900px;
            margin: 0 auto;
            background-color: white;
            padding: 40px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        
        .header {
            text-align: center;
            border-bottom: 3px solid #667eea;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .header h1 {
            color: #667eea;
            font-size: 28px;
            margin-bottom: 10px;
        }
        
        .header p {
            color: #666;
            font-size: 14px;
        }
        
        .meta-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 8px;
        }
        
        .meta-item {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
        }
        
        .meta-label {
            font-weight: bold;
            color: #667eea;
        }
        
        .section {
            margin-bottom: 30px;
        }
        
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #667eea;
            border-left: 4px solid #667eea;
            padding-left: 15px;
            margin-bottom: 15px;
        }
        
        .section-content {
            background-color: #fafafa;
            padding: 15px;
            border-radius: 5px;
            border: 1px solid #eee;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        
        th {
            background-color: #667eea;
            color: white;
            font-weight: bold;
        }
        
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        
        .score-display {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 15px;
            margin: 20px 0;
        }
        
        .score-box {
            text-align: center;
            padding: 20px;
            border-radius: 8px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .score-value {
            font-size: 36px;
            font-weight: bold;
            margin: 10px 0;
        }
        
        .score-label {
            font-size: 14px;
            opacity: 0.9;
        }
        
        .grade-box {
            text-align: center;
            padding: 20px;
            border-radius: 8px;
            background: ${getGradeColor(labResult.scoring?.grade)};
            color: white;
            font-size: 24px;
            font-weight: bold;
        }
        
        .feedback {
            background-color: #e8f4f8;
            border-left: 4px solid #4facfe;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
        }
        
        .feedback-label {
            font-weight: bold;
            color: #4facfe;
            margin-bottom: 10px;
        }
        
        .measurement-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        
        .measurement-name {
            font-weight: 500;
            color: #333;
        }
        
        .measurement-value {
            color: #667eea;
            font-weight: bold;
        }
        
        .footer {
            border-top: 2px solid #667eea;
            padding-top: 20px;
            margin-top: 30px;
            text-align: center;
            color: #999;
            font-size: 12px;
        }
        
        .page-break {
            page-break-after: always;
        }
        
        @media print {
            body {
                background-color: white;
            }
            .container {
                box-shadow: none;
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>Laboratory Report</h1>
            <p>Alchemist Research Platform</p>
        </div>
        
        <!-- Meta Information -->
        <div class="meta-info">
            <div class="meta-item">
                <span class="meta-label">Lab Title:</span>
                <span>${lab.title}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Subject:</span>
                <span>${lab.subject}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Started:</span>
                <span>${formatDate(labResult.startedAt)} at ${formatTime(labResult.startedAt)}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Completed:</span>
                <span>${labResult.completedAt ? formatDate(labResult.completedAt) + ' at ' + formatTime(labResult.completedAt) : 'Not completed'}</span>
            </div>
        </div>
        
        <!-- Objectives Section -->
        ${lab.objectives && lab.objectives.length > 0 ? `
        <div class="section">
            <div class="section-title">📌 Objectives</div>
            <div class="section-content">
                <ul>
                    ${lab.objectives.map((obj) => `<li>${obj}</li>`).join('')}
                </ul>
            </div>
        </div>
        ` : ''}
        
        <!-- Materials Section -->
        ${lab.materials && lab.materials.length > 0 ? `
        <div class="section">
            <div class="section-title">🧪 Materials Required</div>
            <div class="section-content">
                <ul>
                    ${lab.materials.map((mat) => `<li>${mat}</li>`).join('')}
                </ul>
            </div>
        </div>
        ` : ''}
        
        <!-- Procedure Section -->
        ${lab.procedure ? `
        <div class="section">
            <div class="section-title">📋 Procedure</div>
            <div class="section-content">
                <p>${lab.procedure.replace(/\n/g, '<br>')}</p>
            </div>
        </div>
        ` : ''}
        
        <!-- Experiment Data Section -->
        ${labResult.experimentData && labResult.experimentData.measurements && labResult.experimentData.measurements.length > 0 ? `
        <div class="section">
            <div class="section-title">📊 Measurements & Data</div>
            <div class="section-content">
                <table>
                    <thead>
                        <tr>
                            <th>Measurement</th>
                            <th>Value</th>
                            <th>Unit</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${labResult.experimentData.measurements.map((m) => `
                        <tr>
                            <td>${m.name}</td>
                            <td>${m.value}</td>
                            <td>${m.unit || '-'}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        ` : ''}
        
        <!-- Observations Section -->
        ${labResult.experimentData && labResult.experimentData.observations ? `
        <div class="section">
            <div class="section-title">🔍 Observations</div>
            <div class="section-content">
                <p>${labResult.experimentData.observations}</p>
            </div>
        </div>
        ` : ''}
        
        <!-- Results Section -->
        ${labResult.results ? `
        <div class="section">
            <div class="section-title">✅ Results & Calculations</div>
            <div class="section-content">
                ${labResult.results.calculatedValues ? `
                <table>
                    <thead>
                        <tr>
                            <th>Parameter</th>
                            <th>Calculated Value</th>
                            <th>Expected Value</th>
                            <th>Error %</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.keys(labResult.results.calculatedValues).map((key) => `
                        <tr>
                            <td>${key}</td>
                            <td>${labResult.results.calculatedValues[key]}</td>
                            <td>${labResult.results.expectedValues?.[key] || 'N/A'}</td>
                            <td>${labResult.results.errors?.[key] || 'N/A'}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
                ` : ''}
            </div>
        </div>
        ` : ''}
        
        <!-- Scoring & Grading Section -->
        <div class="section">
            <div class="section-title">📈 Scoring & Grading</div>
            <div class="score-display">
                <div class="score-box">
                    <div class="score-label">Total Score</div>
                    <div class="score-value">${labResult.scoring?.totalScore || 0}/${labResult.scoring?.maxScore || 100}</div>
                </div>
                <div class="score-box">
                    <div class="score-label">Accuracy</div>
                    <div class="score-value">${labResult.scoring?.accuracy || 0}%</div>
                </div>
                <div class="grade-box">
                    <div class="score-label">Grade</div>
                    <div class="score-value">${labResult.scoring?.grade || 'N/A'}</div>
                </div>
            </div>
            
            ${labResult.scoring?.feedback ? `
            <div class="feedback">
                <div class="feedback-label">Instructor Feedback:</div>
                <p>${labResult.scoring.feedback}</p>
            </div>
            ` : ''}
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p>Generated on ${formatDate(new Date())} at ${formatTime(new Date())}</p>
            <p>Alchemist Research Platform © 2026</p>
        </div>
    </div>
</body>
</html>
  `;

  return htmlContent;
};

/**
 * Get color for grade badge
 */
const getGradeColor = (grade) => {
  const colors = {
    'A': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'B': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'C': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'D': 'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)',
    'F': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  };
  
  return colors[grade] || colors['F'];
};

/**
 * Generate simple report summary
 */
const generateReportSummary = (labResult, lab) => {
  return {
    labTitle: lab.title,
    subject: lab.subject,
    startTime: labResult.startedAt,
    endTime: labResult.completedAt,
    score: labResult.scoring?.totalScore,
    grade: labResult.scoring?.grade,
    accuracy: labResult.scoring?.accuracy,
    status: labResult.status,
    feedback: labResult.scoring?.feedback
  };
};

module.exports = {
  generateHTMLReport,
  generateReportSummary,
  getGradeColor
};
