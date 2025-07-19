<?php
// api/database/seeders/news_seeder.php - News seeder

require_once __DIR__ . '/../connection.php';
require_once __DIR__ . '/../../models/NewsModel.php';
require_once __DIR__ . '/../../helpers/SlugHelper.php';

class NewsSeeder {
    private $pdo;
    private $newsModel;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->newsModel = new NewsModel($pdo);
    }

    public function run() {
        echo "Seeding news...\n";
        
        $news = [
            [
                'title' => 'New Library Resources Available',
                'content' => '<p>We are excited to announce that our school library has been expanded with new digital resources and physical books. Students now have access to over 10,000 additional titles, including e-books, audiobooks, and educational databases.</p><p>The new collection includes:</p><ul><li>STEM-focused literature and reference materials</li><li>Multilingual books to support our diverse student body</li><li>Interactive learning platforms for all grade levels</li><li>Professional development resources for teachers</li></ul><p>Visit the library to explore these new resources and speak with our librarians about how to make the most of these materials.</p>',
                'is_active' => true
            ],
            [
                'title' => 'School Achieves Outstanding Academic Performance',
                'content' => '<p>We are proud to announce that our school has achieved outstanding results in the latest academic assessments. Our students consistently demonstrate excellence across all subject areas, with significant improvements in mathematics, science, and literacy.</p><p>Key highlights include:</p><ul><li>95% of students meeting or exceeding grade-level expectations</li><li>40% improvement in standardized test scores</li><li>Recognition for innovative teaching methods</li><li>Strong performance in extracurricular activities</li></ul><p>These achievements reflect the dedication of our teachers, students, and parents working together to create an exceptional learning environment.</p>',
                'is_active' => true
            ],
            [
                'title' => 'Technology Upgrade Initiative Launched',
                'content' => '<p>Our school is embarking on a comprehensive technology upgrade initiative to enhance the learning experience for all students. This multi-phase project will modernize our digital infrastructure and provide cutting-edge tools for education.</p><p>The upgrade includes:</p><ul><li>New computer labs with the latest hardware</li><li>Interactive whiteboards in all classrooms</li><li>High-speed internet connectivity throughout campus</li><li>Digital learning platforms and software licenses</li><li>Professional development for teachers on new technologies</li></ul><p>This investment ensures our students are prepared for the digital future and have access to the best educational technology available.</p>',
                'is_active' => true
            ],
            [
                'title' => 'Environmental Sustainability Program',
                'content' => '<p>Our school is proud to launch a comprehensive environmental sustainability program aimed at reducing our carbon footprint and teaching students about environmental responsibility.</p><p>The program includes:</p><ul><li>Solar panel installation on school buildings</li><li>Recycling and waste reduction initiatives</li><li>Organic garden and composting program</li><li>Environmental education curriculum integration</li><li>Student-led green initiatives and clubs</li></ul><p>Through this program, we\'re not only making our school more environmentally friendly but also educating the next generation of environmental stewards.</p>',
                'is_active' => true
            ],
            [
                'title' => 'New Sports Facilities Opening',
                'content' => '<p>We are excited to announce the opening of our new state-of-the-art sports facilities, which will provide students with enhanced opportunities for physical education and athletic development.</p><p>The new facilities include:</p><ul><li>Indoor swimming pool with Olympic-size dimensions</li><li>Multi-purpose gymnasium with basketball and volleyball courts</li><li>Outdoor track and field complex</li><li>Fitness center with modern equipment</li><li>Locker rooms and changing facilities</li></ul><p>These facilities will support our physical education programs and provide space for various sports teams and recreational activities.</p>',
                'is_active' => true
            ],
            [
                'title' => 'Community Partnership Program',
                'content' => '<p>Our school is launching a new community partnership program that connects students with local businesses, organizations, and professionals to provide real-world learning experiences and career exploration opportunities.</p><p>The program features:</p><ul><li>Internship opportunities for high school students</li><li>Guest speaker series with industry professionals</li><li>Mentorship programs with community leaders</li><li>Service learning projects with local organizations</li><li>Career exploration workshops and field trips</li></ul><p>This initiative strengthens our connection with the community while providing valuable experiences for our students.</p>',
                'is_active' => true
            ],
            [
                'title' => 'Student Mental Health Support Services',
                'content' => '<p>We are expanding our student support services to include comprehensive mental health resources and counseling programs. This initiative reflects our commitment to the holistic well-being of every student.</p><p>New services include:</p><ul><li>On-site licensed counselors and psychologists</li><li>Peer support and mentoring programs</li><li>Stress management and wellness workshops</li><li>Parent education sessions on mental health</li><li>24/7 crisis intervention hotline</li></ul><p>These services ensure that students have the support they need to thrive academically, socially, and emotionally.</p>',
                'is_active' => true
            ],
            [
                'title' => 'International Exchange Program Launch',
                'content' => '<p>Our school is proud to announce the launch of an international exchange program that will provide students with opportunities to study abroad and host international students.</p><p>The program includes:</p><ul><li>Partnerships with schools in multiple countries</li><li>Short-term and long-term exchange opportunities</li><li>Cultural immersion experiences</li><li>Language learning support</li><li>Virtual exchange programs using technology</li></ul><p>This program promotes global awareness, cultural understanding, and international friendships among our students.</p>',
                'is_active' => true
            ],
            [
                'title' => 'Arts and Music Program Expansion',
                'content' => '<p>We are expanding our arts and music programs to provide more opportunities for creative expression and artistic development. The expansion includes new courses, equipment, and performance opportunities.</p><p>New offerings include:</p><ul><li>Digital arts and graphic design courses</li><li>Instrumental music lessons for all skill levels</li><li>Drama and theater production classes</li><li>Art gallery and exhibition spaces</li><li>Performance opportunities throughout the year</li></ul><p>These programs nurture creativity, self-expression, and artistic talent in our students.</p>',
                'is_active' => true
            ],
            [
                'title' => 'Parent Engagement Initiative',
                'content' => '<p>We are launching a comprehensive parent engagement initiative to strengthen the partnership between home and school. This program provides multiple ways for parents to be involved in their child\'s education.</p><p>The initiative includes:</p><ul><li>Regular parent-teacher communication platforms</li><li>Parent education workshops and seminars</li><li>Volunteer opportunities in classrooms and events</li><li>Parent advisory committees and feedback sessions</li><li>Family events and activities throughout the year</li></ul><p>Strong parent engagement is essential for student success, and we\'re committed to making it easy and meaningful for families to participate.</p>',
                'is_active' => true
            ],
            [
                'title' => 'STEM Education Enhancement',
                'content' => '<p>Our school is enhancing its STEM (Science, Technology, Engineering, and Mathematics) education programs to prepare students for future careers in these rapidly growing fields.</p><p>Enhancements include:</p><ul><li>Advanced robotics and coding classes</li><li>3D printing and maker space facilities</li><li>Science lab upgrades with modern equipment</li><li>STEM competitions and challenges</li><li>Partnerships with local universities and tech companies</li></ul><p>These programs develop critical thinking, problem-solving, and innovation skills that are essential for success in the 21st century.</p>',
                'is_active' => true
            ],
            [
                'title' => 'School Safety and Security Updates',
                'content' => '<p>We are implementing comprehensive safety and security updates to ensure the well-being of all students, staff, and visitors. These measures enhance our existing safety protocols and provide peace of mind for our school community.</p><p>Updates include:</p><ul><li>Enhanced campus surveillance and monitoring systems</li><li>Improved emergency response procedures</li><li>Regular safety drills and training for staff</li><li>Visitor management and access control systems</li><li>Mental health and conflict resolution programs</li></ul><p>The safety of our school community is our top priority, and these measures ensure a secure learning environment for everyone.</p>',
                'is_active' => true
            ]
        ];

        $insertedCount = 0;
        foreach ($news as $newsData) {
            try {
                // Generate slug from title
                $newsData['slug'] = generateSlug($newsData['title']);
                $newsData['slug'] = ensureUniqueSlug($this->pdo, $newsData['slug'], 'news', 'slug');
                
                // Set default values
                if (!isset($newsData['is_active'])) {
                    $newsData['is_active'] = true;
                }
                
                // Create news
                $newsId = $this->newsModel->create($newsData);
                $insertedCount++;
                
                echo "Created news: {$newsData['title']} (ID: {$newsId})\n";
                
            } catch (Exception $e) {
                echo "Error creating news '{$newsData['title']}': " . $e->getMessage() . "\n";
            }
        }
        
        echo "Successfully seeded {$insertedCount} news articles.\n";
    }

    public function clear() {
        echo "Clearing news table...\n";
        try {
            $this->pdo->exec("DELETE FROM news");
            $this->pdo->exec("ALTER TABLE news AUTO_INCREMENT = 1");
            echo "News table cleared successfully.\n";
        } catch (Exception $e) {
            echo "Error clearing news table: " . $e->getMessage() . "\n";
        }
    }
}

// Run seeder if called directly
if (php_sapi_name() === 'cli') {
    global $pdo;
    $seeder = new NewsSeeder($pdo);
    
    if (isset($argv[1]) && $argv[1] === 'clear') {
        $seeder->clear();
    } else {
        $seeder->run();
    }
}
?> 