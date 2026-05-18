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
            Globe.position.set(0, 0, 0);
            Globe.scale.set(1, 1, 1);
            
            // SIDEBAR ANIMATIONS 
            for (let i = 2; i <= 7; i++) {
                // Create timeline for sidebar entrance
                const sidebarTL = gsap.timeline({
                    scrollTrigger: {
                        trigger: `#section${i}`,
                        start: "top 80%",
                        end: "top 30%",
                        scrub: false,
                        once: true,
                        markers: false // Set to true for debugging
                    }
                });
                
                // Animate sidebar from left
                sidebarTL.fromTo(`#section${i} .sidebar`,
                    {
                        x: -10,
                        opacity: 0
                    },
                    {
                        x: 0,
                        opacity: 1,
                        duration: 1,
                        ease: "power3.out"
                    }
                );
            }
            
            // GLOBE SCROLL ANIMATIONS
            
            // Timeline for section 1 (hero) - Earth is centered
            const section1TL = gsap.timeline({
                scrollTrigger: {
                    trigger: "#section1",
                    start: "top top",
                    end: "bottom top",
                    scrub: 1.5,
                    markers: false
                }
            });
            

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
                x: 100,
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
            
            // Timeline for sections 4-6 - Keep Earth on right with slight movement
            const sections4to7TL = gsap.timeline({
                scrollTrigger: {
                    trigger: "#section4",
                    start: "top bottom",
                    end: "bottom top+=200%",
                    scrub: 2,
                    markers: false
                }
            });
            
            sections4to7TL.to(Globe.position, {
                x: 100,
                duration: 2,
                ease: "power1.inOut"
            });
            
            // Timeline for final section - Fade out Earth
            const finalSectionTL = gsap.timeline({
                scrollTrigger: {
                    trigger: "#section8",
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
            
            // FINAL PANEL ANIMATION
            gsap.from("#section8 .final-message", {
                y: 50,
                opacity: 0,
                duration: 1.5,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: "#section8",
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
                Globe.rotation.y += 0.0005;
                
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
        trigger: "#section8",
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
    
    // Setup gradient control after a brief delay
    setTimeout(setupGradientControl, 100);
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGlobe);
} else {
    initGlobe();
}
