document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.querySelector('.search-bar input');
    const searchButton = document.querySelector('.search-bar button');
    const blocks = document.querySelectorAll('.cannabis-block');

    // ฟังก์ชันสำหรับแมปชื่อบล็อกไปยัง URL
    function mapBlockTitleToURL(title) {
        const blockMapping = {
            'News': '/details/block1',
            'Strains & Product': '/details/block2',
            'THC': '/details/block3',
            'CBD': '/details/block4',
            'Politics': '/details/block5',
            'Health': '/details/block6',
            'Science & Tech': '/details/block7',
            'Lifestyle': '/details/block8',
            '420': '/details/block9',
            'Cannabis 101': '/details/block10'
        };

        return blockMapping[title] || '/not-found';
    }

    // ฟังก์ชันค้นหา
    searchButton.addEventListener('click', function() {
        const query = searchInput.value.toLowerCase().trim();

        if (query) {
            window.location.href = `/search?q=${encodeURIComponent(query)}`;
        }
    });

    // กด Enter เพื่อค้นหา
    searchInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            searchButton.click();
        }
    });

    // เมื่อคลิกบล็อก
    blocks.forEach(block => {
        block.addEventListener('click', function() {
            const blockTitle = block.querySelector('span').textContent.trim();
            const targetURL = mapBlockTitleToURL(blockTitle);
            window.location.href = targetURL;
        });
    });
});
