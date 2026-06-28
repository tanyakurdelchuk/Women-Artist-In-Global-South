import ThreeGlobe from "https://esm.sh/three-globe?external=three";
import * as THREE from "https://esm.sh/three";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls.js?external=three";

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// NAV SCROLLING
document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        const target = link.dataset.target;
        document.getElementById(target).scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });
});



// Initialize Globe
function initGlobe() {
    fetch("./assets/ne_110m_admin_0_countries.geojson")
        .then(res => res.json())
        .then(countries => {
            
            // Set up renderer
            const renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: true
            });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            const globeContainer = document.getElementById("globeViz");
            globeContainer.appendChild(renderer.domElement);
            
            // Create scene
            const scene = new THREE.Scene();
            scene.fog = new THREE.Fog(0x090c18, 400, 2000);
            
            // Create globe
            const Globe = new ThreeGlobe()
                .hexPolygonsData(countries.features)
                .hexPolygonResolution(3)
                .hexPolygonMargin(0.3)
                .hexPolygonColor(() => "#A3A5FF")
                .hexPolygonCurvatureResolution(10);
            
            scene.add(Globe);
            
            // Lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
            scene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
            directionalLight.position.set(5, 3, 5);
            scene.add(directionalLight);
            
            // Camera
            const camera = new THREE.PerspectiveCamera(
                45,
                window.innerWidth / window.innerHeight,
                0.1,
                2000
            );
            camera.position.z = 500;
            
            // Controls - Disabled for smooth scrolling
            const controls = new TrackballControls(camera, renderer.domElement);
            controls.noZoom = true;
            controls.noPan = true;
            controls.staticMoving = true;
            controls.rotateSpeed = 5.0;
            
            // Initial Globe position and scale
            Globe.position.set(0, -120, 0);
            Globe.scale.set(2.0, 2.0, 2.0);
            const globeFeatures = countries.features;

            // Countries highlighted in sections 2-4 (Global South focus)
            const highlightedCountries = new Set([
                // Latin America
                "Brazil", "Argentina", "Mexico", "Chile", "Colombia", "Venezuela", "Belize",
                "Peru", "Uruguay", "Ecuador", "Haiti", "Dominican Republic",
                "Panama", "Bolivia", "Costa Rica", "El Salvador", "The Bahamas", "Bahamas",
                "Jamaica", "Paraguay", "Guatemala", "Cuba", "Honduras", "Nicaragua", "Suriname", "Guyana", "Puerto Rico", "Trinidad and Tobago",
                // Africa
                "Algeria", "South Africa", "Morocco", "Nigeria", "Tunisia", "Mali", "Guinea", "Western Sahara",
                "Ivory Coast", "Cote d'Ivoire", "Côte d'Ivoire", "Democratic Republic of the Congo", "Dem. Rep. Congo", "Cameroon",
                "Benin", "Senegal", "Togo", "Egypt", "Mauritius", "Burkina Faso",
                "Angola", "Ghana", "Mozambique", "Madagascar", "Liberia", "Zimbabwe",
                "Ethiopia", "Rwanda", "Botswana", "Gabon", "Malawi", "Namibia",
                "Uganda", "Kenya", "Somaliland", "Somalia", "United Republic of Tanzania", "Tanzania", "Niger", "Sudan", "South Sudan", "Zambia", "Libya", "Sierra Leone", "Republic of the Congo", "Congo", "Chad", "Central African Republic", "Eritrea", "Djibouti", "Mauritania", "Lesotho", "Swaziland", "Eswatini", "Burundi", "Guinea-Bissau", "Gambia",
                // Asia
                "Iran", "Palestine", "Israel", "India", "Indonesia", "Thailand", "Vietnam", "Laos", "Myanmar", "Syria", "Oman", "United Arab Emirates", "Qatar",
                "Jordan", "Philippines", "Armenia", "Iraq", "Pakistan",
                "Kuwait", "Saudi Arabia", "Cambodia", "Malaysia", "Bangladesh",
                "Nepal", "Afghanistan", "Turkmenistan", "Sri Lanka",
                "Yemen", "China", "Mongolia", "Taiwan", "Singapore", "Brunei", "Bhutan", "North Korea",
                // Oceania
                "Papua New Guinea", "Fiji", "Samoa", "Tonga", "Vanuatu", "Solomon Islands", "East Timor", "Timor-Leste",
                // Europe
                "Croatia", "Republic of Serbia", "Serbia", "Bosnia and Herzegovina", "Northern Cyprus", "Cyprus"
            ]);

            const highlightColor = "#a3a5ff";
            const dimColor = "#2d2d44";

            function normalizeCountryName(name) {
                return String(name || "")
                    .toLowerCase()
                    .replace(/[.]/g, "")
                    .replace(/\s+/g, " ")
                    .trim();
            }

            const normalizedHighlightedCountries = new Set(
                Array.from(highlightedCountries, normalizeCountryName)
            );

            function isHighlightedCountry(feature) {
                const props = feature?.properties || {};
                const candidateNames = [
                    props.ADMIN,
                    props.NAME,
                    props.NAME_LONG,
                    props.SOVEREIGNT,
                    props.GEOUNIT,
                    props.SUBUNIT
                ];

                return candidateNames.some(name => normalizedHighlightedCountries.has(normalizeCountryName(name)));
            }

            function applySection2to4Highlight() {
                Globe.hexPolygonColor(d => (isHighlightedCountry(d) ? highlightColor : dimColor));
                Globe.hexPolygonsData(globeFeatures);
            }

            function resetDefaultHexColor() {
                Globe.hexPolygonColor(() => "#A3A5FF");
                Globe.hexPolygonsData(globeFeatures);
            }

            function spotlightCountries(countryNames = []) {
                const normalizedTargets = new Set(countryNames.map(normalizeCountryName));
                Globe.hexPolygonColor(feature => {
                    const props = feature?.properties || {};
                    const candidateNames = [
                        props.ADMIN,
                        props.NAME,
                        props.NAME_LONG,
                        props.SOVEREIGNT,
                        props.GEOUNIT,
                        props.SUBUNIT
                    ];
                    const isTarget = candidateNames.some(name => normalizedTargets.has(normalizeCountryName(name)));
                    return isTarget ? "#edf8d1" : "#2d2d44";
                });
                Globe.hexPolygonsData(globeFeatures);
            }

            // SECTION ENTRANCES
            const sidebarSections = [2, 3, 4, 6, 7, 8, 9, 10];
            sidebarSections.forEach(sectionNumber => {
                const sidebar = document.querySelector(`#section${sectionNumber} .sidebar`);
                if (!sidebar) return;

                gsap.fromTo(sidebar,
                    { x: -10, opacity: 0 },
                    {
                        x: 0,
                        opacity: 1,
                        duration: 1,
                        ease: "power3.out",
                        scrollTrigger: {
                            trigger: `#section${sectionNumber}`,
                            start: "top 80%",
                            end: "top 30%",
                            once: true,
                            markers: false
                        }
                    }
                );
            });

            gsap.fromTo("#section5 .researchers-container",
                { y: 30, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 1,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: "#section5",
                        start: "top 80%",
                        once: true,
                        markers: false
                    }
                }
            );

            gsap.fromTo("#section5 .researcher-card",
                { y: 20, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.85,
                    ease: "power3.out",
                    stagger: 0.15,
                    scrollTrigger: {
                        trigger: "#section5",
                        start: "top 80%",
                        once: true,
                        markers: false
                    }
                }
            );

            // GLOBE SCROLL ANIMATIONS

            // Timeline for section 1 (hero) - Earth starts zoomed and lowers, then returns to normal by panel 2
            const section1TL = gsap.timeline({
                scrollTrigger: {
                    trigger: "#section1",
                    start: "top top",
                    end: "bottom top+=30%",
                    scrub: 1.5,
                    markers: false
                }
            });

            section1TL.fromTo(Globe.position,
                { x: 0, y: -400, z: 0 },
                {
                    x: 0,
                    y: 0,
                    z: 0,
                    ease: "power2.inOut"
                }, 0
            );

            section1TL.fromTo(Globe.scale,
                { x: 3.5, y: 3.5, z: 3.5 },
                {
                    x: 1,
                    y: 1,
                    z: 1,
                    ease: "power2.inOut"
                }, 0
            );

            // Timeline for section 2 - Move Earth to right
            const section2TL = gsap.timeline({
                scrollTrigger: {
                    trigger: "#section2",
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 1.5,
                    markers: false
                }
            });
            
            // Move Earth to right side for section 2
            section2TL.to(Globe.position, {
                x: 150,
                duration: 1,
                ease: "power2.inOut"
            });
            
            // Timeline for section 3 - Zoom in
            const section3TL = gsap.timeline({
                scrollTrigger: {
                    trigger: "#section3",
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 1.5,
                    markers: false
                }
            });
            
            section3TL.to(Globe.scale, {
                x: 1.6,
                y: 1.6,
                z: 1.6,
                duration: 1,
                ease: "power2.inOut"
            });

            // Panels 2-4: highlight only selected countries in purple
            ScrollTrigger.create({
                trigger: "#section2",
                start: "top 65%",
                endTrigger: "#section5",
                end: "top 65%",
                onEnter: applySection2to4Highlight,
                onEnterBack: applySection2to4Highlight,
                onLeave: resetDefaultHexColor,
                onLeaveBack: resetDefaultHexColor
            });
            
            // Timeline for sections 4-5 - Keep Earth on right with slight movement
            const sections4to7TL = gsap.timeline({
                scrollTrigger: {
                    trigger: "#section4",
                    start: "top bottom",
                    end: "bottom top+=150%",
                    scrub: 2,
                    markers: false
                }
            });
            
            sections4to7TL.to(Globe.position, {
                x: 150,
                duration: 2,
                ease: "power1.inOut"
            });

            // ---- ARTIST SPOTLIGHT: stop spin and change globe focus by section ----
            let globeSpinning = true;

            const marinaArcs = [{
                startLat: 44.82,
                startLng: 20.46,
                endLat: 52.3676,
                endLng: 4.9041
            }];

            const mariaArcs = [{
                startLat: -23.55,
                startLng: -46.63,
                endLat: 40.71,
                endLng: -74.01
            }];

            Globe
                .arcsData([])
                .arcStartLat(d => d.startLat)
                .arcStartLng(d => d.startLng)
                .arcEndLat(d => d.endLat)
                .arcEndLng(d => d.endLng)
                .arcColor(() => ["rgba(163,165,255,0)", "#41b6c4", "rgba(163,165,255,0)"])
                .arcAltitude(0.3)
                .arcStroke(0.6)
                .arcDashLength(0.35)
                .arcDashGap(0.15)
                .arcDashAnimateTime(2500);

            function faceGlobe(lat, lng, duration = 2.5) {
                const TWO_PI = Math.PI * 2;
                const targetY = -lng * Math.PI / 180;
                const targetX = lat * Math.PI / 180;
                const currentY = Globe.rotation.y;
                const currentMod = ((currentY % TWO_PI) + TWO_PI) % TWO_PI;
                const targetMod = ((targetY % TWO_PI) + TWO_PI) % TWO_PI;
                const delta = ((targetMod - currentMod + TWO_PI + Math.PI) % TWO_PI) - Math.PI;

                gsap.to(Globe.rotation, {
                    y: currentY + delta,
                    x: targetX,
                    duration,
                    ease: "power2.inOut"
                });
            }

            ScrollTrigger.create({
                trigger: "#section6",
                start: "top 65%",
                onEnter: () => {
                    globeSpinning = false;
                    // Center on Belgrade during Abramovic section.
                    faceGlobe(44.82, 20.46);
                    spotlightCountries(["Serbia", "Republic of Serbia", "Netherlands"]);
                    Globe.arcsData(marinaArcs);
                },
                onLeaveBack: () => {
                    globeSpinning = true;
                    Globe.arcsData([]);
                    resetDefaultHexColor();
                    gsap.to(Globe.rotation, { x: 0, duration: 1, ease: "power2.inOut" });
                }
            });

            ScrollTrigger.create({
                trigger: "#section8",
                start: "top 65%",
                onEnter: () => {
                    globeSpinning = false;
                    // Keep Brazil highlighted while framing Haiti to better read trajectory.
                    faceGlobe(18.9712, -72.2852);
                    spotlightCountries(["Brazil", "United States of America", "United States"]);
                    Globe.arcsData(mariaArcs);
                },
                onLeaveBack: () => {
                    faceGlobe(44.82, 20.46);
                    spotlightCountries(["Serbia", "Republic of Serbia", "Netherlands"]);
                    Globe.arcsData(marinaArcs);
                }
            });

            ScrollTrigger.create({
                trigger: "#section10",
                start: "top 65%",
                onEnter: () => {
                    globeSpinning = false;
                    faceGlobe(-14.24, -51.93);
                    Globe.arcsData([]);
                    Globe.hexPolygonColor(d => {
                        const n = d.properties.ADMIN || d.properties.name || "";
                        return n === "Brazil" ? "#edf8d1" : "#2d2d44";
                    });
                    Globe.hexPolygonsData(globeFeatures);
                },
                onLeaveBack: () => {
                    faceGlobe(-23.55, -46.63);
                    Globe.arcsData(mariaArcs);
                    spotlightCountries(["Brazil"]);
                }
            });

            // Timeline for final section - Fade out Earth
            const finalSectionTL = gsap.timeline({
                scrollTrigger: {
                    trigger: "#section11",
                    start: "top 50%",
                    end: "top 20%",
                    scrub: 1,
                    markers: false
                }
            });

            finalSectionTL.to(Globe.material, {
                opacity: 0,
                duration: 1,
                ease: "power2.inOut"
            });

            ScrollTrigger.create({
                trigger: "#section11",
                start: "top 65%",
                onEnter: () => {
                    globeSpinning = true;
                    Globe.hexPolygonColor(() => "#9181f9");
                    Globe.hexPolygonsData(globeFeatures);
                },
                onLeaveBack: () => {
                    globeSpinning = false;
                    Globe.hexPolygonColor(d => {
                        const n = d.properties.ADMIN || d.properties.name || "";
                        return n === "Brazil" ? "#edf8d1" : "#2d2d44";
                    });
                    Globe.hexPolygonsData(globeFeatures);
                }
            });
            
            // FINAL PANEL ANIMATION
            gsap.from("#section11 .final-message", {
                y: 50,
                opacity: 0,
                duration: 1.5,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: "#section11",
                    start: "top 80%",
                    once: true
                }
            });

            // Handle window resize
            function onWindowResize() {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            }
            window.addEventListener('resize', onWindowResize);
            
            // Animation loop
            function animate() {
                requestAnimationFrame(animate);
                
                // Slow, continuous rotation
                if (globeSpinning) Globe.rotation.y += 0.0005;
                
                // Render scene
                renderer.render(scene, camera);
            }
            
            // Start animation
            animate();
            
            // Debug helper - check if elements are visible
            console.log("Globe initialized");
            console.log("Sidebar elements:", document.querySelectorAll('.sidebar').length);
            
        })
        .catch(error => {
            console.error('Error loading globe data:', error);
            document.getElementById('globeViz').innerHTML = 
                '<div style="color: white; text-align: center; padding-top: 50px;">Globe data could not be loaded</div>';
        });
}

// CONTROL GRADIENT VISIBILITY BASED ON SCROLL POSITION
function setupGradientControl() {
    const gradientBg = document.getElementById('radial-gradient-bg');
    const body = document.body;
    
    // Show gradient only when in sections 2-7
    ScrollTrigger.create({
        trigger: "#section2",
        start: "top center",
        end: "bottom bottom",
        onEnter: () => body.classList.add('show-gradient'),
        onLeaveBack: () => body.classList.remove('show-gradient')
    });
    
    ScrollTrigger.create({
        trigger: "#section11",
        start: "top center",
        onEnter: () => body.classList.remove('show-gradient'),
        onLeaveBack: () => body.classList.add('show-gradient')
    });
}

// Call this after initializing everything
document.addEventListener('DOMContentLoaded', function() {
    // Add gradient div to HTML
    const gradientDiv = document.createElement('div');
    gradientDiv.id = 'radial-gradient-bg';
    document.body.appendChild(gradientDiv);
    
    // Create accordion (after hero)
    if (typeof createAccordion === 'function') createAccordion();

    // Setup gradient control after a brief delay
    setTimeout(setupGradientControl, 100);

    // --- Page stepper initialization (moved from index.html) ---
    (function(){
        const stepper = document.getElementById('page-stepper');
        const stepperInner = document.getElementById('stepperInner');
        if(!stepper || !stepperInner) return;

        // Use 10 steps for the updated sequence after adding two new pages
        const mainSections = ['section2','section3','section4','section5','section6','section7','section8','section9','section10','section11'];
        const showFrom = 'section2';
        const showTo = 'section11';

        // Build step elements
        mainSections.forEach((id, idx) => {
            const item = document.createElement('div');
            item.className = 'step-item pending';
            item.dataset.target = id;

            const circle = document.createElement('div');
            circle.className = 'step-circle';
            item.appendChild(circle);

            if (idx < mainSections.length - 1) {
                const line = document.createElement('div');
                line.className = 'step-line';
                item.appendChild(line);
            }

            item.addEventListener('click', () => {
                const target = document.getElementById(item.dataset.target);
                if (target) target.scrollIntoView({behavior:'smooth'});
            });

            stepperInner.appendChild(item);
        });

        function updateVisibilityAndState() {
            const sections = mainSections.map(id => document.getElementById(id)).filter(Boolean);
            if (!sections.length) return;

            let mostVisible = {id: null, area: 0, index: 0};
            sections.forEach((el, i) => {
                const rect = el.getBoundingClientRect();
                const visibleH = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
                const area = visibleH * rect.width;
                if (area > mostVisible.area) mostVisible = {id: el.id, area, index: i};
            });

            const showFromIndex = mainSections.indexOf(showFrom);
            const showToIndex = mainSections.indexOf(showTo);
            const currentIndex = mostVisible.id ? mostVisible.index : -1;
            const shouldShow = currentIndex >= showFromIndex && currentIndex <= showToIndex;

            stepper.style.opacity = shouldShow ? '1' : '0';
            stepper.style.pointerEvents = shouldShow ? 'auto' : 'none';
            stepper.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');

            const items = stepperInner.querySelectorAll('.step-item');
            items.forEach((it, i) => {
                it.classList.remove('done','active','pending');
                if (i < currentIndex) it.classList.add('done');
                else if (i === currentIndex) it.classList.add('active');
                else it.classList.add('pending');
            });
        }

        let tick = false;
        function onTick(){ tick = false; updateVisibilityAndState(); }
        ['scroll','resize','orientationchange'].forEach(ev => window.addEventListener(ev, () => { if (!tick) { tick = true; requestAnimationFrame(onTick); } }));

        setTimeout(updateVisibilityAndState, 200);
    })();
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGlobe);
} else {
    initGlobe();

    // -----------------------------
    // Accordion builder

    function createAccordion() {
        const menuItems = [
            {
                id: "why",
                title: "Why This Project",
                description: "Exploring the intersection of art, technology, and human creativity through an innovative digital platform.",
                color: "#edf8d1",
                bgColor: "#0a0e1c",
                textColor: "#edf8d1",
                hexagonImg: "img/hexagon1.png",
                maskImage: "img/hexagon1.png",
                contentImage: "img/img5G839312.png",
                href: "index.html#section2"
            },
            {
                id: "artists",
                title: "The Artists",
                description: "Meet the talented creators behind this collection, each bringing their unique vision and style to the platform.",
                color: "#a3a5ff",
                bgColor: "#0a0e1c",
                textColor: "#edf8d1",
                hexagonImg: "img/hexagon2.png",
                maskImage: "img/hexagon2.png",
                contentImage: "img/imgImage1.png",
                href: "library.html"
            },
            {
                id: "data",
                title: "View Data",
                description: "Dive into the analytics and insights that power our understanding of creative trends and audience engagement.",
                color: "#94b4d0",
                bgColor: "#0a0e1c",
                textColor: "#edf8d1",
                hexagonImg: "img/hexagon3.png",
                maskImage: "img/hexagon3.png",
                contentImage: "img/imgImage28.png",
                href: "cartography.html"
            }
        ];

        const container = document.getElementById('accordionContainer');
        if (!container) return;

        function createEl(tag, attrs = {}, children = []) {
            const el = document.createElement(tag);
            Object.keys(attrs).forEach(key => {
                if (key === 'className') el.className = attrs[key];
                else if (key === 'style' && typeof attrs[key] === 'object') Object.assign(el.style, attrs[key]);
                else el.setAttribute(key, attrs[key]);
            });
            children.forEach(child => {
                if (typeof child === 'string') el.appendChild(document.createTextNode(child));
                else el.appendChild(child);
            });
            return el;
        }

        menuItems.forEach(item => {
            const wrapper = createEl('div', { className: 'accordion-item', id: `item-${item.id}` });

            const collapsed = createEl('div', { className: 'collapsed-state', style: { borderBottom: `2px solid ${item.color}` } });
            const titleP = createEl('p', { className: 'collapsed-title', style: { color: item.color } }, [item.title]);
            const hexContainer = createEl('div', { className: 'hexagon-indicator' });
            const hexImg = createEl('img', { src: item.hexagonImg, alt: 'hexagon' });
            hexContainer.appendChild(hexImg);
            collapsed.appendChild(titleP);
            collapsed.appendChild(hexContainer);

            const expanded = createEl('div', { className: 'expanded-state', style: { backgroundColor: item.bgColor } });
            const inner = createEl('div', { className: 'expanded-inner' });
            const textDiv = createEl('div', { className: 'expanded-text' });
            const expTitle = createEl('p', { className: 'expanded-title', style: { color: item.textColor } }, [item.title]);
            const expDesc = createEl('p', { className: 'expanded-desc', style: { color: item.textColor } }, [item.description]);
            textDiv.appendChild(expTitle);
            textDiv.appendChild(expDesc);

            const maskWrapper = createEl('div', { className: 'masked-image-wrapper' });
            const maskInner = createEl('div', { className: 'masked-image-inner', style: { maskImage: `url('${item.maskImage}')`, WebkitMaskImage: `url('${item.maskImage}')` } });
            const contentImg = createEl('img', { src: item.contentImage, alt: item.title });
            maskInner.appendChild(contentImg);
            maskWrapper.appendChild(maskInner);

            inner.appendChild(textDiv);
            inner.appendChild(maskWrapper);
            expanded.appendChild(inner);

            wrapper.appendChild(collapsed);
            wrapper.appendChild(expanded);

            wrapper.addEventListener('mouseenter', () => {
                document.querySelectorAll('.accordion-item').forEach(el => {
                    if (el.id !== wrapper.id) {
                        el.classList.remove('expanded');
                        el.style.height = '220px';
                    }
                });
                wrapper.classList.add('expanded');
                wrapper.style.height = '395px';
            });

            wrapper.addEventListener('click', () => {
                if (item.href) {
                    window.location.href = item.href;
                }
            });

            container.appendChild(wrapper);
        });

        container.addEventListener('mouseleave', () => {
            setTimeout(() => {
                const hovered = document.querySelector('.accordion-item:hover');
                if (!hovered) {
                    document.querySelectorAll('.accordion-item').forEach(el => {
                        el.classList.remove('expanded');
                        el.style.height = '220px';
                    });
                }
            }, 50);
        });
    }
}
