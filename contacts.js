document.addEventListener('DOMContentLoaded', function () {
    const timelineData = [
        {
            step: '01',
            title: 'Artist submits portfolio',
            description: 'Upload a curated selection of your best work along with an artist statement and exhibition history.',
            status: 'completed'
        },
        {
            step: '02',
            title: 'Curatorial review',
            description: 'Our expert curatorial team reviews submissions on a rolling basis, evaluating technical skill and unique vision.',
            status: 'active'
        },
        {
            step: '03',
            title: 'Represented status activated',
            description: 'Once approved, your official profile is activated on the platform, granting you access to our collector network.',
            status: 'pending'
        },
        {
            step: '04',
            title: 'Platform negotiates',
            description: 'We handle all inquiries, negotiations, and logistics, ensuring you receive fair market value for your art.',
            status: 'pending'
        }
    ];

    const timeline = document.getElementById('timeline');
    if (timeline) {
        timelineData.forEach((item) => {
            const itemDiv = createEl('div', {
                className: `timeline-item ${item.status}`
            });

            const dot = createEl('div', { className: 'timeline-dot' });
            const inner = createEl('div', { className: 'inner' });
            dot.appendChild(inner);

            const number = createEl('span', { className: 'timeline-number' }, [item.step]);

            const content = createEl('div', { className: 'timeline-content' });
            const title = createEl('h3', {}, [item.title]);
            const desc = createEl('p', {}, [item.description]);
            content.appendChild(title);
            content.appendChild(desc);

            itemDiv.appendChild(dot);
            itemDiv.appendChild(number);
            itemDiv.appendChild(content);

            timeline.appendChild(itemDiv);
        });
    }

    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            alert('Message sent! (Demo)');
        });
    }

    function createEl(tag, attrs = {}, children = []) {
        const el = document.createElement(tag);
        Object.keys(attrs).forEach((key) => {
            if (key === 'className') el.className = attrs[key];
            else if (key === 'style' && typeof attrs[key] === 'object') {
                Object.assign(el.style, attrs[key]);
            } else {
                el.setAttribute(key, attrs[key]);
            }
        });
        children.forEach((child) => {
            if (typeof child === 'string') el.appendChild(document.createTextNode(child));
            else el.appendChild(child);
        });
        return el;
    }
});
