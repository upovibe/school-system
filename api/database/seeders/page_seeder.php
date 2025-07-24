<?php
// api/database/seeders/page_seeder.php - Seeder for default pages

class PageSeeder
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    public function run()
    {
        echo "🌱 Seeding default pages...\n";

        $this->seedDefaultPages();

        echo "✅ Default pages seeded successfully!\n";
    }

    private function seedDefaultPages()
    {
        echo "📝 Seeding default pages...\n";

        $defaultPages = [
            // ===== GENERAL PAGES =====
            [
                'slug' => 'home',
                'name' => 'Home',
                'subtitle' => 'Welcome to our school',
                'title' => 'Home',
                'content' => '<h2>Welcome to Our School</h2><p>We are dedicated to nurturing young minds and fostering a love for learning in a supportive and inclusive environment. Our commitment to academic excellence, character development, and holistic education prepares students for success in an ever-changing world.</p><p>Discover our vibrant community where every student is encouraged to reach their full potential through innovative teaching methods, comprehensive programs, and a strong foundation of values.</p>',
                'meta_description' => 'Welcome to our school - where excellence meets opportunity. Discover our comprehensive educational programs, dedicated staff, and commitment to student success.',
                'category' => 'general',
                'is_active' => 1,
                'sort_order' => 1,
                'banner_image' => json_encode([])
            ],
            [
                'slug' => 'contact',
                'name' => 'Contact',
                'subtitle' => 'How to reach us',
                'title' => 'Contact Us',
                'content' => '<h2>Get in Touch</h2><p>We welcome your questions, feedback, and inquiries. Our dedicated staff is here to assist you with any information about our programs, admissions, or general school matters.</p><h3>Office Hours</h3><p>Monday - Friday: 7:30 AM - 4:00 PM<br>Saturday: 8:00 AM - 12:00 PM<br>Sunday: Closed</p><h3>Emergency Contact</h3><p>For urgent matters outside office hours, please contact our emergency line.</p>',
                'meta_description' => 'Contact our school for inquiries, admissions, or general information. Find our location, phone numbers, and office hours.',
                'category' => 'general',
                'is_active' => 1,
                'sort_order' => 2,
                'banner_image' => json_encode([])
            ],

            // ===== ABOUT PAGES =====
            [
                'slug' => 'about-us',
                'name' => 'About',
                'subtitle' => 'Our story and heritage',
                'title' => 'About Us',
                'content' => '<h2>Our Story</h2><p>Founded with a vision to provide exceptional education, our school has been serving the community for many years. We have grown from a small institution to a comprehensive educational center that prepares students for the challenges of tomorrow.</p><h3>Our Heritage</h3><p>With a rich history of academic excellence and community involvement, we continue to build on our strong foundation while embracing innovation and modern educational practices.</p><h3>Our Community</h3><p>We are proud of our diverse and inclusive community where students from various backgrounds come together to learn, grow, and succeed.</p>',
                'meta_description' => 'Learn about our school\'s history, heritage, and commitment to providing quality education in a supportive community environment.',
                'category' => 'about',
                'is_active' => 1,
                'sort_order' => 3,
                'banner_image' => json_encode([])
            ],
            [
                'slug' => 'mission-vision',
                'name' => 'Mission & Vision',
                'subtitle' => 'Our mission and vision',
                'title' => 'Mission & Vision',
                'content' => '<h2>Our Mission</h2><p>To provide a comprehensive, student-centered education that empowers learners to achieve their full potential academically, socially, and emotionally. We strive to create an environment that fosters critical thinking, creativity, and a lifelong love for learning.</p><h2>Our Vision</h2><p>To be a leading educational institution that inspires excellence, nurtures character, and prepares students to become responsible global citizens who contribute positively to society.</p><h3>Core Beliefs</h3><ul><li>Every student has unique potential</li><li>Education should be holistic and inclusive</li><li>Partnership between school, family, and community is essential</li><li>Continuous improvement drives excellence</li></ul>',
                'meta_description' => 'Discover our school\'s mission, vision, and core beliefs that guide our educational approach and commitment to student success.',
                'category' => 'about',
                'is_active' => 1,
                'sort_order' => 4,
                'banner_image' => json_encode([])
            ],
            [
                'slug' => 'values-aims',
                'name' => 'Values & Aims',
                'subtitle' => 'Our core values and educational aims',
                'title' => 'Our Values & Aims',
                'content' => '<h2>Core Values</h2><ul><li><strong>Excellence:</strong> We strive for the highest standards in everything we do</li><li><strong>Integrity:</strong> We act with honesty, fairness, and ethical behavior</li><li><strong>Respect:</strong> We value diversity and treat everyone with dignity</li><li><strong>Innovation:</strong> We embrace creativity and new approaches to learning</li><li><strong>Collaboration:</strong> We work together to achieve common goals</li><li><strong>Responsibility:</strong> We take ownership of our actions and learning</li></ul><h2>Educational Aims</h2><p>Our educational aims focus on developing well-rounded individuals who are:</p><ul><li>Academically prepared for future challenges</li><li>Socially responsible and empathetic</li><li>Physically healthy and active</li><li>Emotionally resilient and confident</li><li>Culturally aware and globally minded</li></ul>',
                'meta_description' => 'Explore our core values and educational aims that shape our approach to teaching and learning.',
                'category' => 'about',
                'is_active' => 1,
                'sort_order' => 5,
                'banner_image' => json_encode([])
            ],
            [
                'slug' => 'our-team',
                'name' => 'Team',
                'subtitle' => 'Meet our staff and faculty',
                'title' => 'Our Team',
                'content' => '<h2>Leadership Team</h2><p>Our experienced leadership team provides strategic direction and ensures the highest standards of education and care for all students.</p><h3>Administrative Staff</h3><p>Our dedicated administrative staff works tirelessly to support the smooth operation of our school and provide excellent service to our community.</p><h3>Teaching Faculty</h3><p>Our qualified and experienced teachers are passionate about education and committed to helping each student reach their potential. They bring diverse expertise and innovative teaching methods to create engaging learning experiences.</p><h3>Support Staff</h3><p>Our support staff plays a crucial role in maintaining a safe, clean, and nurturing environment for our students.</p>',
                'meta_description' => 'Meet our dedicated team of educators, administrators, and support staff who work together to provide excellent education.',
                'category' => 'about',
                'is_active' => 1,
                'sort_order' => 6,
                'banner_image' => json_encode([])
            ],

            // ===== ACADEMICS PAGES =====
            [
                'slug' => 'academics',
                'name' => 'Academics',
                'subtitle' => 'Academic programs and approach',
                'title' => 'Academics',
                'content' => '<h2>Academic Excellence</h2><p>Our comprehensive academic program is designed to challenge and inspire students at every level. We offer a balanced curriculum that combines traditional academic rigor with modern teaching methodologies.</p><h3>Our Approach</h3><p>We believe in personalized learning that recognizes each student\'s unique strengths and learning style. Our teachers use innovative strategies to engage students and foster a deep understanding of concepts.</p><h3>Curriculum Overview</h3><p>Our curriculum is aligned with national standards and designed to prepare students for success in higher education and beyond. We emphasize critical thinking, problem-solving, and real-world application of knowledge.</p><h3>Assessment & Progress</h3><p>We use a variety of assessment methods to track student progress and provide meaningful feedback that supports continuous improvement.</p>',
                'meta_description' => 'Explore our comprehensive academic programs designed to challenge and inspire students at every level.',
                'category' => 'academics',
                'is_active' => 1,
                'sort_order' => 7,
                'banner_image' => json_encode([])
            ],
            [
                'slug' => 'pre-school',
                'name' => 'Pre-School',
                'subtitle' => 'Early childhood education',
                'title' => 'Pre-School',
                'content' => '<h2>Early Childhood Education</h2><p>Our pre-school program provides a nurturing foundation for children aged 3-5 years, focusing on holistic development through play-based learning and structured activities.</p><h3>Program Highlights</h3><ul><li>Age-appropriate learning activities</li><li>Social and emotional development</li><li>Early literacy and numeracy skills</li><li>Creative arts and physical development</li><li>Safe and stimulating environment</li></ul><h3>Learning Areas</h3><p>Our curriculum covers essential early learning areas including language development, mathematics, science exploration, arts and crafts, music, and physical education.</p><h3>Daily Schedule</h3><p>We provide a balanced daily schedule that includes structured learning time, free play, outdoor activities, and rest periods to support healthy development.</p>',
                'meta_description' => 'Discover our nurturing pre-school program designed to provide a strong foundation for early childhood development.',
                'category' => 'academics',
                'is_active' => 1,
                'sort_order' => 8,
                'banner_image' => json_encode([])
            ],
            [
                'slug' => 'primary-school',
                'name' => 'Primary School',
                'subtitle' => 'Primary education (Grades 1-6)',
                'title' => 'Primary School',
                'content' => '<h2>Primary Education (Grades 1-6)</h2><p>Our primary school program builds on the foundation established in pre-school, providing a comprehensive education that develops essential academic skills and character traits.</p><h3>Core Subjects</h3><ul><li><strong>Language Arts:</strong> Reading, writing, speaking, and listening skills</li><li><strong>Mathematics:</strong> Problem-solving, critical thinking, and mathematical concepts</li><li><strong>Science:</strong> Scientific inquiry, experimentation, and discovery</li><li><strong>Social Studies:</strong> History, geography, and civic understanding</li><li><strong>Physical Education:</strong> Health, fitness, and sports skills</li></ul><h3>Special Programs</h3><p>We offer enrichment programs in music, art, technology, and foreign languages to provide a well-rounded educational experience.</p><h3>Character Development</h3><p>Character education is integrated throughout our curriculum, helping students develop values such as respect, responsibility, and integrity.</p>',
                'meta_description' => 'Explore our comprehensive primary school program that develops essential academic skills and character traits.',
                'category' => 'academics',
                'is_active' => 1,
                'sort_order' => 9,
                'banner_image' => json_encode([])
            ],
            [
                'slug' => 'junior-high-school',
                'name' => 'Junior High',
                'subtitle' => 'Junior high program (Grades 7-9)',
                'title' => 'Junior High School',
                'content' => '<h2>Junior High School (Grades 7-9)</h2><p>Our junior high program prepares students for the challenges of secondary education while providing a supportive environment for personal and academic growth.</p><h3>Academic Focus</h3><ul><li><strong>Advanced Mathematics:</strong> Algebra, geometry, and problem-solving</li><li><strong>Language Arts:</strong> Literature, composition, and communication</li><li><strong>Science:</strong> Biology, chemistry, and physics fundamentals</li><li><strong>Social Studies:</strong> World history, geography, and current events</li><li><strong>Technology:</strong> Computer skills and digital literacy</li></ul><h3>Elective Courses</h3><p>Students can choose from various elective courses including foreign languages, arts, music, and technology to explore their interests and talents.</p><h3>College Preparation</h3><p>We begin preparing students for higher education through study skills development, career exploration, and academic planning.</p>',
                'meta_description' => 'Discover our junior high school program that prepares students for secondary education and future success.',
                'category' => 'academics',
                'is_active' => 1,
                'sort_order' => 10,
                'banner_image' => json_encode([])
            ],

            // ===== COMMUNITY PAGES =====
            [
                'slug' => 'community',
                'name' => 'Community',
                'subtitle' => 'Our school community',
                'title' => 'Community',
                'content' => '<h2>Our School Community</h2><p>We are proud of our vibrant and inclusive school community where students, parents, teachers, and staff work together to create a supportive learning environment.</p><h3>Parent Involvement</h3><p>We believe that education is a partnership between school and home. We encourage active parent participation through various programs and events.</p><h3>Student Life</h3><p>Beyond academics, we offer a rich array of extracurricular activities, clubs, and events that help students develop leadership skills and build lasting friendships.</p><h3>Community Outreach</h3><p>We are committed to serving our broader community through various outreach programs and partnerships with local organizations.</p>',
                'meta_description' => 'Discover our vibrant school community where students, parents, and staff work together to create an excellent learning environment.',
                'category' => 'community',
                'is_active' => 1,
                'sort_order' => 11,
                'banner_image' => json_encode([])
            ],
            [
                'slug' => 'events',
                'name' => 'Events',
                'subtitle' => 'School events and activities',
                'title' => 'Events',
                'content' => '<h2>School Events & Activities</h2><p>Throughout the academic year, we host various events that bring our community together and celebrate our students\' achievements.</p><h3>Annual Events</h3><ul><li><strong>Open House:</strong> Learn about our programs and meet our staff</li><li><strong>Sports Day:</strong> Annual athletic competition and celebration</li><li><strong>Cultural Festival:</strong> Celebration of diversity and cultural heritage</li><li><strong>Graduation Ceremony:</strong> Honoring our graduating students</li><li><strong>Parent-Teacher Conferences:</strong> Regular communication about student progress</li></ul><h3>Special Programs</h3><p>We organize special programs including science fairs, art exhibitions, music performances, and academic competitions.</p><h3>Community Events</h3><p>Join us for community-building events such as family picnics, charity drives, and volunteer activities.</p>',
                'meta_description' => 'Stay updated with all the exciting events and activities happening at our school throughout the year.',
                'category' => 'community',
                'is_active' => 1,
                'sort_order' => 12,
                'banner_image' => json_encode([])
            ],
            [
                'slug' => 'news',
                'name' => 'News',
                'subtitle' => 'Latest news and updates',
                'title' => 'News',
                'content' => '<h2>Latest News & Updates</h2><p>Stay informed about the latest happenings, achievements, and important updates from our school community.</p><h3>Student Achievements</h3><p>We celebrate our students\' accomplishments in academics, sports, arts, and community service.</p><h3>School Updates</h3><p>Important announcements about programs, policies, and school improvements.</p><h3>Community Highlights</h3><p>Stories about our community involvement, partnerships, and special initiatives.</p><h3>Educational Insights</h3><p>Articles and resources about education, parenting, and student development.</p>',
                'meta_description' => 'Read the latest news and updates from our school community, including student achievements and important announcements.',
                'category' => 'community',
                'is_active' => 1,
                'sort_order' => 13,
                'banner_image' => json_encode([])
            ],
            [
                'slug' => 'announcements',
                'name' => 'Announcements',
                'subtitle' => 'Important announcements',
                'title' => 'Announcements',
                'content' => '<h2>Important Announcements</h2><p>Stay updated with important announcements and information for students, parents, and staff.</p><h3>Academic Announcements</h3><p>Updates about exams, assignments, academic schedules, and educational programs.</p><h3>Administrative Notices</h3><p>Important information about school policies, procedures, and administrative matters.</p><h3>Event Reminders</h3><p>Reminders about upcoming events, meetings, and special activities.</p><h3>Emergency Information</h3><p>Critical information about school closures, safety procedures, and emergency protocols.</p>',
                'meta_description' => 'Important announcements and updates for students, parents, and staff members.',
                'category' => 'community',
                'is_active' => 1,
                'sort_order' => 14,
                'banner_image' => json_encode([])
            ],

            // ===== GALLERY PAGES =====
            [
                'slug' => 'gallery',
                'name' => 'Gallery',
                'subtitle' => 'Photos and videos',
                'title' => 'Gallery',
                'content' => '<h2>School Gallery</h2><p>Explore our visual journey through photos and videos that capture the spirit, activities, and achievements of our school community.</p><h3>What You\'ll Find</h3><p>Our gallery showcases various aspects of school life including academic activities, sports events, cultural celebrations, and community gatherings.</p><h3>Photo Collections</h3><p>Browse through our photo collections organized by events, activities, and school year.</p><h3>Video Highlights</h3><p>Watch video highlights from special events, performances, and school activities.</p>',
                'meta_description' => 'Explore our school gallery featuring photos and videos of events, activities, and achievements.',
                'category' => 'gallery',
                'is_active' => 1,
                'sort_order' => 15,
                'banner_image' => json_encode([])
            ],
            [
                'slug' => 'photos',
                'name' => 'Photos',
                'subtitle' => 'Photo gallery',
                'title' => 'Photos',
                'content' => '<h2>Photo Gallery</h2><p>Browse through our collection of photographs that capture the vibrant life and activities of our school community.</p><h3>Event Photos</h3><p>Photos from school events, celebrations, and special occasions.</p><h3>Academic Activities</h3><p>Images from classroom activities, science fairs, and academic competitions.</p><h3>Sports & Recreation</h3><p>Action shots from sports events, physical education classes, and recreational activities.</p><h3>Campus Life</h3><p>Scenes from daily school life, campus facilities, and student interactions.</p>',
                'meta_description' => 'Browse our photo gallery featuring school events, activities, and campus life.',
                'category' => 'gallery',
                'is_active' => 1,
                'sort_order' => 16,
                'banner_image' => json_encode([])
            ],
            [
                'slug' => 'videos',
                'name' => 'Videos',
                'subtitle' => 'Video gallery',
                'title' => 'Videos',
                'content' => '<h2>Video Gallery</h2><p>Watch videos showcasing our school events, performances, and community activities.</p><h3>School Events</h3><p>Video recordings of important school events, ceremonies, and celebrations.</p><h3>Student Performances</h3><p>Highlights from music concerts, drama productions, and talent shows.</p><h3>Educational Content</h3><p>Educational videos, presentations, and learning resources.</p><h3>Community Highlights</h3><p>Videos featuring community involvement, partnerships, and special projects.</p>',
                'meta_description' => 'Watch videos from school events, performances, and community activities.',
                'category' => 'gallery',
                'is_active' => 1,
                'sort_order' => 17,
                'banner_image' => json_encode([])
            ],

            // ===== ADMISSIONS PAGES =====
            [
                'slug' => 'admissions',
                'name' => 'Admissions',
                'subtitle' => 'Join our school community',
                'title' => 'Admissions',
                'content' => '<h2>Join Our School Community</h2><p>We welcome applications from families who share our commitment to academic excellence and character development. Our admission process is designed to ensure the best fit between students and our educational program.</p><h3>Why Choose Us?</h3><ul><li>Comprehensive academic programs</li><li>Experienced and dedicated faculty</li><li>Safe and nurturing environment</li><li>Strong community values</li><li>Excellent facilities and resources</li></ul><h3>Admission Timeline</h3><p>We accept applications throughout the year, with priority given to early applications. Contact our admissions office for specific deadlines and requirements.</p><h3>Financial Information</h3><p>We are committed to making quality education accessible. Information about tuition, fees, and financial assistance is available upon request.</p>',
                'meta_description' => 'Learn about our admission process, requirements, and how to apply to join our school community.',
                'category' => 'admissions',
                'is_active' => 1,
                'sort_order' => 18,
                'banner_image' => json_encode([])
            ],
            [
                'slug' => 'requirements',
                'name' => 'Requirements',
                'subtitle' => 'Admission requirements',
                'title' => 'Admission Requirements',
                'content' => '<h2>Admission Requirements</h2><p>To ensure the best educational experience for all students, we have established clear admission requirements and procedures.</p><h3>General Requirements</h3><ul><li>Completed application form</li><li>Birth certificate or passport</li><li>Previous school records (if applicable)</li><li>Immunization records</li><li>Recent passport-sized photographs</li><li>Application fee payment</li></ul><h3>Age Requirements</h3><p>Students must meet the appropriate age requirements for their grade level as of the start of the academic year.</p><h3>Academic Requirements</h3><p>For students transferring from other schools, we review previous academic records to ensure appropriate grade placement.</p><h3>English Proficiency</h3><p>For non-native English speakers, we may require additional language support or assessment.</p>',
                'meta_description' => 'Learn about the admission requirements and documents needed to apply to our school.',
                'category' => 'admissions',
                'is_active' => 1,
                'sort_order' => 19,
                'banner_image' => json_encode([])
            ],
            [
                'slug' => 'process',
                'name' => 'Process',
                'subtitle' => 'Step-by-step application guide',
                'title' => 'Application Process',
                'content' => '<h2>Application Process</h2><p>Our application process is designed to be straightforward and informative, helping families understand our school and ensuring the best fit for their child.</p><h3>Step 1: Inquiry</h3><p>Contact our admissions office to learn more about our programs and schedule a school tour.</p><h3>Step 2: Application</h3><p>Complete and submit the application form along with all required documents and fees.</p><h3>Step 3: Assessment</h3><p>Students may be required to take placement tests or participate in interviews to determine appropriate grade placement.</p><h3>Step 4: Review</h3><p>Our admissions committee reviews all applications and makes decisions based on available spaces and student needs.</p><h3>Step 5: Enrollment</h3><p>Accepted students complete the enrollment process, including payment of fees and orientation.</p><h3>Important Dates</h3><p>Contact our admissions office for current application deadlines and important dates.</p>',
                'meta_description' => 'Understand our step-by-step application process and what to expect when applying to our school.',
                'category' => 'admissions',
                'is_active' => 1,
                'sort_order' => 20,
                'banner_image' => json_encode([])
            ]
        ];

        foreach ($defaultPages as $page) {
            $this->seedPage($page);
        }
    }

    private function seedPage($pageData)
    {
        try {
            // Check if page already exists
            $stmt = $this->pdo->prepare('SELECT id FROM pages WHERE slug = ?');
            $stmt->execute([$pageData['slug']]);

            if ($stmt->fetch()) {
                echo "⚠️  Page '{$pageData['slug']}' already exists\n";
                return;
            }

            $stmt = $this->pdo->prepare('
                INSERT INTO pages (slug, name, subtitle, title, content, meta_description, category, is_active, sort_order, banner_image, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ');

            $stmt->execute([
                $pageData['slug'],
                $pageData['name'],
                $pageData['subtitle'] ?? '',
                $pageData['title'],
                $pageData['content'],
                $pageData['meta_description'],
                $pageData['category'],
                $pageData['is_active'],
                $pageData['sort_order'],
                $pageData['banner_image']
            ]);

            echo "✅ Seeded page: {$pageData['slug']}\n";
        } catch (Exception $e) {
            echo "❌ Error seeding page {$pageData['slug']}: " . $e->getMessage() . "\n";
        }
    }
} 