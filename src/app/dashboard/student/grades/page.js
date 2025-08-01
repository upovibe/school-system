import App from '@/core/App.js';
import '@/components/ui/Badge.js';
import '@/components/ui/Card.js';
import '@/components/ui/Progress.js';

/**
 * Student Grades Page Component (/dashboard/student/grades)
 * 
 * Displays student grades and academic performance across subjects.
 */
class StudentGradesPage extends App {
    constructor() {
        super();
        this.grades = [
            {
                subject: 'Mathematics',
                teacher: 'Mr. Johnson',
                assignments: [
                    { name: 'Algebra Quiz', grade: 'A-', score: 88, maxScore: 100, date: '2024-01-05' },
                    { name: 'Geometry Test', grade: 'B+', score: 85, maxScore: 100, date: '2024-01-12' },
                    { name: 'Calculus Assignment', grade: 'A', score: 95, maxScore: 100, date: '2024-01-15' }
                ],
                average: 89.3,
                letterGrade: 'A-',
                category: 'Core'
            },
            {
                subject: 'English Literature',
                teacher: 'Mrs. Williams',
                assignments: [
                    { name: 'Shakespeare Essay', grade: 'A-', score: 88, maxScore: 100, date: '2024-01-08' },
                    { name: 'Poetry Analysis', grade: 'B+', score: 87, maxScore: 100, date: '2024-01-14' },
                    { name: 'Creative Writing', grade: 'A', score: 92, maxScore: 100, date: '2024-01-18' }
                ],
                average: 89.0,
                letterGrade: 'A-',
                category: 'Core'
            },
            {
                subject: 'Physics',
                teacher: 'Dr. Smith',
                assignments: [
                    { name: 'Lab Report', grade: 'B+', score: 85, maxScore: 100, date: '2024-01-06' },
                    { name: 'Mechanics Test', grade: 'A-', score: 89, maxScore: 100, date: '2024-01-13' },
                    { name: 'Energy Project', grade: 'A', score: 94, maxScore: 100, date: '2024-01-16' }
                ],
                average: 89.3,
                letterGrade: 'A-',
                category: 'Core'
            },
            {
                subject: 'World History',
                teacher: 'Mr. Davis',
                assignments: [
                    { name: 'Industrial Revolution Paper', grade: 'B+', score: 86, maxScore: 100, date: '2024-01-09' },
                    { name: 'Ancient Civilizations Quiz', grade: 'A-', score: 90, maxScore: 100, date: '2024-01-15' },
                    { name: 'Research Project', grade: 'A', score: 93, maxScore: 100, date: '2024-01-20' }
                ],
                average: 89.7,
                letterGrade: 'A-',
                category: 'Core'
            },
            {
                subject: 'French',
                teacher: 'Mme. Dubois',
                assignments: [
                    { name: 'Vocabulary Quiz', grade: 'B+', score: 85, maxScore: 100, date: '2024-01-12' },
                    { name: 'Grammar Test', grade: 'A-', score: 88, maxScore: 100, date: '2024-01-17' },
                    { name: 'Oral Presentation', grade: 'A', score: 91, maxScore: 100, date: '2024-01-22' }
                ],
                average: 88.0,
                letterGrade: 'B+',
                category: 'Elective'
            },
            {
                subject: 'Art',
                teacher: 'Ms. Rodriguez',
                assignments: [
                    { name: 'Portfolio Review', grade: 'A', score: 92, maxScore: 100, date: '2024-01-10' },
                    { name: 'Sketching Assignment', grade: 'A-', score: 89, maxScore: 100, date: '2024-01-16' },
                    { name: 'Final Project', grade: 'A+', score: 96, maxScore: 100, date: '2024-01-23' }
                ],
                average: 92.3,
                letterGrade: 'A',
                category: 'Elective'
            }
        ];
    }

    connectedCallback() {
        super.connectedCallback();
        document.title = 'My Grades | School System';
    }

    getGradeColor(grade) {
        const gradeColors = {
            'A+': 'text-green-600 bg-green-100',
            'A': 'text-green-600 bg-green-100',
            'A-': 'text-green-500 bg-green-50',
            'B+': 'text-blue-600 bg-blue-100',
            'B': 'text-blue-500 bg-blue-50',
            'B-': 'text-blue-400 bg-blue-50',
            'C+': 'text-yellow-600 bg-yellow-100',
            'C': 'text-yellow-500 bg-yellow-50',
            'C-': 'text-yellow-400 bg-yellow-50',
            'D+': 'text-orange-600 bg-orange-100',
            'D': 'text-orange-500 bg-orange-50',
            'F': 'text-red-600 bg-red-100'
        };
        return gradeColors[grade] || 'text-gray-600 bg-gray-100';
    }

    getOverallGPA() {
        const totalPoints = this.grades.reduce((sum, subject) => sum + subject.average, 0);
        return (totalPoints / this.grades.length).toFixed(1);
    }

    getOverallLetterGrade() {
        const gpa = parseFloat(this.getOverallGPA());
        if (gpa >= 93) return 'A';
        if (gpa >= 90) return 'A-';
        if (gpa >= 87) return 'B+';
        if (gpa >= 83) return 'B';
        if (gpa >= 80) return 'B-';
        if (gpa >= 77) return 'C+';
        if (gpa >= 73) return 'C';
        if (gpa >= 70) return 'C-';
        if (gpa >= 67) return 'D+';
        if (gpa >= 63) return 'D';
        if (gpa >= 60) return 'D-';
        return 'F';
    }

    render() {
        const overallGPA = this.getOverallGPA();
        const overallLetterGrade = this.getOverallLetterGrade();
        const coreSubjects = this.grades.filter(g => g.category === 'Core');
        const electiveSubjects = this.grades.filter(g => g.category === 'Elective');

        return `
            <div class="space-y-6">
                <!-- Page Header -->
                <div class="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                            <div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                <i class="fas fa-chart-line text-xl"></i>
                            </div>
                            <div>
                                <h1 class="text-2xl font-bold">My Grades</h1>
                                <p class="text-green-100">Track your academic performance</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-2xl font-bold">${overallGPA}</div>
                            <div class="text-green-100 text-sm">Overall GPA</div>
                        </div>
                    </div>
                </div>

                <!-- Overall Performance -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="bg-white rounded-xl shadow-lg p-4 border-l-4 border-green-500">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm text-gray-600">Overall Grade</p>
                                <p class="text-2xl font-bold ${this.getGradeColor(overallLetterGrade)}">${overallLetterGrade}</p>
                            </div>
                            <i class="fas fa-star text-green-500 text-2xl"></i>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-lg p-4 border-l-4 border-blue-500">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm text-gray-600">Core Subjects</p>
                                <p class="text-2xl font-bold text-blue-600">${coreSubjects.length}</p>
                            </div>
                            <i class="fas fa-book text-blue-500 text-2xl"></i>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-lg p-4 border-l-4 border-purple-500">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm text-gray-600">Elective Subjects</p>
                                <p class="text-2xl font-bold text-purple-600">${electiveSubjects.length}</p>
                            </div>
                            <i class="fas fa-palette text-purple-500 text-2xl"></i>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-lg p-4 border-l-4 border-orange-500">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm text-gray-600">Total Assignments</p>
                                <p class="text-2xl font-bold text-orange-600">${this.grades.reduce((sum, subject) => sum + subject.assignments.length, 0)}</p>
                            </div>
                            <i class="fas fa-tasks text-orange-500 text-2xl"></i>
                        </div>
                    </div>
                </div>

                <!-- Subject Grades -->
                <div class="space-y-6">
                    <h2 class="text-xl font-semibold text-gray-900">Subject Performance</h2>
                    
                    ${this.grades.map(subject => `
                        <div class="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                            <div class="p-6">
                                <div class="flex items-center justify-between mb-4">
                                    <div class="flex items-center space-x-3">
                                        <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                                            <i class="fas fa-book text-white"></i>
                                        </div>
                                        <div>
                                            <h3 class="text-lg font-semibold text-gray-900">${subject.subject}</h3>
                                            <p class="text-sm text-gray-500">${subject.teacher} • ${subject.category}</p>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-2xl font-bold ${this.getGradeColor(subject.letterGrade)}">${subject.letterGrade}</div>
                                        <div class="text-sm text-gray-500">${subject.average.toFixed(1)}%</div>
                                    </div>
                                </div>
                                
                                <div class="mb-4">
                                    <div class="flex items-center justify-between text-sm text-gray-600 mb-1">
                                        <span>Progress</span>
                                        <span>${subject.average.toFixed(1)}%</span>
                                    </div>
                                    <div class="w-full bg-gray-200 rounded-full h-2">
                                        <div class="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" style="width: ${subject.average}%"></div>
                                    </div>
                                </div>
                                
                                <div class="space-y-2">
                                    <h4 class="text-sm font-medium text-gray-700 mb-3">Recent Assignments</h4>
                                    ${subject.assignments.map(assignment => `
                                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div class="flex items-center space-x-3">
                                                <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                <div>
                                                    <p class="text-sm font-medium text-gray-900">${assignment.name}</p>
                                                    <p class="text-xs text-gray-500">${new Date(assignment.date).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div class="text-right">
                                                <div class="text-sm font-semibold ${this.getGradeColor(assignment.grade)}">${assignment.grade}</div>
                                                <div class="text-xs text-gray-500">${assignment.score}/${assignment.maxScore}</div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Performance Summary -->
                <div class="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 class="text-sm font-medium text-gray-700 mb-3">Core Subjects Average</h4>
                            <div class="space-y-2">
                                ${coreSubjects.map(subject => `
                                    <div class="flex items-center justify-between">
                                        <span class="text-sm text-gray-600">${subject.subject}</span>
                                        <span class="text-sm font-medium ${this.getGradeColor(subject.letterGrade)}">${subject.letterGrade} (${subject.average.toFixed(1)}%)</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div>
                            <h4 class="text-sm font-medium text-gray-700 mb-3">Elective Subjects Average</h4>
                            <div class="space-y-2">
                                ${electiveSubjects.map(subject => `
                                    <div class="flex items-center justify-between">
                                        <span class="text-sm text-gray-600">${subject.subject}</span>
                                        <span class="text-sm font-medium ${this.getGradeColor(subject.letterGrade)}">${subject.letterGrade} (${subject.average.toFixed(1)}%)</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('app-student-grades-page', StudentGradesPage);
export default StudentGradesPage; 