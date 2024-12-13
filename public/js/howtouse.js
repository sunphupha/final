document.addEventListener('DOMContentLoaded', function() {
    const sidebarItems = document.querySelectorAll('.sidebar-item');

    sidebarItems.forEach(item => {
        item.addEventListener('click', function() {
            sidebarItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            const contentTitle = this.querySelector('h5').textContent;
            const contentDescription = this.querySelector('p').textContent;
            const contentImage = this.dataset.image;

            const contentArea = document.querySelector('.content');
            contentArea.innerHTML = `
                <h2>${contentTitle}</h2>
                <p>${contentDescription}</p>
                <img src="${contentImage}" alt="${contentTitle}">
            `;
        });
    });
});