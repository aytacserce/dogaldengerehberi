///////////////////////////////////////////////////////////
// CURRENT YEAR
const yearEl = document.querySelector('.year');
if (yearEl) {
	const currentYear = new Date().getFullYear();
	yearEl.textContent = currentYear;
}

///////////////////////////////////////////////////////////
// MOBILE NAV WORK
const btnNavEl = document.querySelector('.btn-mobile-nav');
const headerEl = document.querySelector('.header');
if (btnNavEl && headerEl) {
	btnNavEl.addEventListener('click', function () {
		headerEl.classList.toggle('nav-open');
	});
}

///////////////////////////////////////////////////////////
// Smooth scrolling animation
// (a:Link yazımındaki harf hatası a:link olarak düzeltildi)
const allLinks = document.querySelectorAll('a:link');

allLinks.forEach(function (link) {
	link.addEventListener('click', function (e) {
		const href = link.getAttribute('href');

		// Allow normal navigation if it's NOT an anchor link
		if (!href || !href.startsWith('#')) return;

		e.preventDefault();

		//scroll back to top
		if (href === '#') {
			window.scrollTo({
				top: 0,
				behavior: 'smooth',
			});
		}

		//go to section
		if (href !== '#' && href.startsWith('#')) {
			const sectionEl = document.querySelector(href);
			if (sectionEl) sectionEl.scrollIntoView({ behavior: 'smooth' });
		}

		//close mobile nav
		if (link.classList.contains('main-nav-link')) {
			headerEl.classList.toggle('nav-open');
		}
	});
});

///////////////////////////////////////////////////////////
// Sticky Navigation
const sectionHeroEl = document.querySelector('.section-hero');

if (sectionHeroEl) {
	const obs = new IntersectionObserver(
		function (entries) {
			const ent = entries[0];
			if (ent.isIntersecting === false) {
				document.body.classList.add('sticky');
			}
			if (ent.isIntersecting === true) {
				document.body.classList.remove('sticky');
			}
		},
		{
			//inside viewport
			root: null,
			threshold: 0,
			rootMargin: '-80px',
		}
	);
	obs.observe(sectionHeroEl);
}

///////////////////////////////////////////////////////////
// Fixing flexbox gap property missing in some Safari versions
function checkFlexGap() {
	var flex = document.createElement('div');
	flex.style.display = 'flex';
	flex.style.flexDirection = 'column';
	flex.style.rowGap = '1px';

	flex.appendChild(document.createElement('div'));
	flex.appendChild(document.createElement('div'));

	document.body.appendChild(flex);
	var isSupported = flex.scrollHeight === 1;
	flex.parentNode.removeChild(flex);

	if (!isSupported) document.body.classList.add('no-flexbox-gap');
}
checkFlexGap();
