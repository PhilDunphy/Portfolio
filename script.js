document.addEventListener('DOMContentLoaded', () => {
	// --- Intro Animations ---
	// Left side: sequential fade in
	const introTl = gsap.timeline({ defaults: { ease: 'power2.out' } })
	introTl
		.to('.profile-pic', { opacity: 1, duration: 0.8, delay: 0.3 })
		.to('.intro-name', { opacity: 1, duration: 0.8 }, '-=0.4')
		.to('.intro-bio', { opacity: 1, duration: 0.8 }, '-=0.4')
		.to('.scroll-indicator', { opacity: 1, duration: 0.8 }, '-=0.4')

	// Right side: achievement cards slide in from right, staggered
	gsap.to('.achieve-card', {
		opacity: 1,
		x: 0,
		duration: 0.7,
		stagger: 0.2,
		ease: 'power2.out',
		delay: 0.8
	})

	// Right side: skill tags fade in together after cards
	gsap.to('.skill-tags', {
		opacity: 1,
		duration: 0.8,
		ease: 'power2.out',
		delay: 1.8
	})

	// Scroll indicator pulse
	gsap.to('.scroll-indicator', {
		opacity: 0.4,
		duration: 1.5,
		repeat: -1,
		yoyo: true,
		ease: 'power1.inOut',
		delay: 2.5
	})

	const lenis = new Lenis()
	lenis.on('scroll', ScrollTrigger.update)
	gsap.ticker.add(time => lenis.raf(time * 1e3))
	gsap.ticker.lagSmoothing(0)
	const workSection = document.querySelector('.work')
	const cardsContainer = document.querySelector('.cards')
	let moveDistance = window.innerWidth * 5
	let currentXPosition = 0
	const lerp = (start, end, t) => start + (end - start) * t
	const gridCanvas = document.createElement('canvas')
	gridCanvas.id = 'grid-canvas'
	workSection.appendChild(gridCanvas)
	const gridCtx = gridCanvas.getContext('2d')
	const resizeGridCanvas = () => {
		const dpr = window.devicePixelRatio || 1
		;[gridCanvas.width, gridCanvas.height] = [
			window.innerWidth * dpr,
			window.innerHeight * dpr,
		]
		;[gridCanvas.style.width, gridCanvas.style.height] = [
			`${window.innerWidth}px`,
			`${window.innerHeight}px`,
		]
		gridCtx.scale(dpr, dpr)
	}
	resizeGridCanvas()
	const drawGrid = (scrollProgress = 0) => {
		gridCtx.fillStyle = 'black'
		gridCtx.fillRect(0, 0, gridCanvas.width, gridCanvas.height)
		gridCtx.fillStyle = '#f40c3f'
		const [dotSize, spacing] = [1, 30]
		const [rows, cols] = [
			Math.ceil(gridCanvas.height / spacing),
			Math.ceil(gridCanvas.width / spacing) + 15,
		]
		const offset = (scrollProgress * spacing * 10) % spacing
		for (let y = 0; y < rows; y++) {
			for (let x = 0; x < cols; x++) {
				gridCtx.beginPath()
				gridCtx.arc(x * spacing - offset, y * spacing, dotSize, 0, Math.PI * 2)
				gridCtx.fill()
			}
		}
	}
	const lettersScene = new THREE.Scene()
	const lettersCamera = new THREE.PerspectiveCamera(
		50,
		window.innerWidth / window.innerHeight,
		0.1,
		1e3,
	)
	lettersCamera.position.z = 20
	const lettersRenderer = new THREE.WebGLRenderer({
		antialias: true,
		alpha: true,
	})
	lettersRenderer.setSize(window.innerWidth, window.innerHeight)
	lettersRenderer.setClearColor(0, 0)
	lettersRenderer.setPixelRatio(window.devicePixelRatio)
	lettersRenderer.domElement.id = 'letters-canvas'
	workSection.appendChild(lettersRenderer.domElement)
	const createTextAnimationPath = (yPos, amplitude) => {
		const points = []
		for (let i = 0; i <= 20; i++) {
			const t = i / 20
			points.push(
				new THREE.Vector3(
					-25 + 50 * t,
					yPos + Math.sin(t * Math.PI) * -amplitude,
					(1 - Math.pow(Math.abs(t - 0.5) * 2, 2)) * -5,
				),
			)
		}
		const curve = new THREE.CatmullRomCurve3(points)
		const line = new THREE.Line(
			new THREE.BufferGeometry().setFromPoints(curve.getPoints(100)),
			new THREE.LineBasicMaterial({ color: 0, linewidth: 1 }),
		)
		line.curve = curve
		return line
	}
	const path = [
		createTextAnimationPath(10, 2),
		createTextAnimationPath(3.5, 1),
		createTextAnimationPath(-3.5, -1),
		createTextAnimationPath(-10, -2),
	]
	path.forEach(line => lettersScene.add(line))
	const textContainer = document.querySelector('.text-container')
	const letterPositions = /* @__PURE__ */ new Map()
	path.forEach((line, i) => {
		const char = ['W', 'O', 'R', 'K'][i]
		line.letterElements = Array.from({ length: 15 }, () => {
			const el = document.createElement('div')
			el.className = 'letter'
			el.textContent = char
			el.dataset.char = char
			textContainer.appendChild(el)
			letterPositions.set(el, {
				current: { x: 0, y: 0 },
				target: { x: 0, y: 0 },
			})
			return el
		})
	})
	const lineSpeedMultipliers = [0.8, 1, 0.7, 0.9]
	const updateTargetPositions = (scrollProgress = 0) => {
		path.forEach((line, lineIndex) => {
			line.letterElements.forEach((element, i) => {
				const point = line.curve.getPoint(
					(i / 14 + scrollProgress * lineSpeedMultipliers[lineIndex]) % 1,
				)
				const vector = point.clone().project(lettersCamera)
				const positions = letterPositions.get(element)
				positions.target = {
					x: (-vector.x * 0.5 + 0.5) * window.innerWidth,
					y: (-vector.y * 0.5 + 0.5) * window.innerHeight,
				}
			})
		})
	}
	const updateLetterPositions = () => {
		letterPositions.forEach((positions, element) => {
			const distX = positions.target.x - positions.current.x
			if (Math.abs(distX) > window.innerWidth * 0.7) {
				;[positions.current.x, positions.current.y] = [
					positions.target.x,
					positions.target.y,
				]
			} else {
				positions.current.x = lerp(
					positions.current.x,
					positions.target.x,
					0.07,
				)
				positions.current.y = lerp(
					positions.current.y,
					positions.target.y,
					0.07,
				)
			}
			element.style.transform = `translate(-50%, -50%) translate3d(${positions.current.x}px, ${positions.current.y}px, 0px)`
		})
	}
	const updateCardsPosition = () => {
		const targetX = -moveDistance * (ScrollTrigger.getAll()[0]?.progress || 0)
		currentXPosition = lerp(currentXPosition, targetX, 0.07)
		gsap.set(cardsContainer, {
			x: currentXPosition,
		})
	}
	const animate = () => {
		updateLetterPositions()
		updateCardsPosition()
		lettersRenderer.render(lettersScene, lettersCamera)
		requestAnimationFrame(animate)
	}
	ScrollTrigger.create({
		trigger: '.work',
		start: 'top top',
		end: '+=700%',
		pin: true,
		pinSpacing: true,
		scrub: 1,
		onUpdate: self => {
			updateTargetPositions(self.progress)
			drawGrid(self.progress)
		},
	})
	drawGrid(0)
	animate()
	updateTargetPositions(0)
	window.addEventListener('resize', () => {
		moveDistance = window.innerWidth * 5
		resizeGridCanvas()
		drawGrid(ScrollTrigger.getAll()[0]?.progress || 0)
		lettersCamera.aspect = window.innerWidth / window.innerHeight
		lettersCamera.updateProjectionMatrix()
		lettersRenderer.setSize(window.innerWidth, window.innerHeight)
		updateTargetPositions(ScrollTrigger.getAll()[0]?.progress || 0)
	})
	// --- Company Content Data ---
	const companyData = {
		Amazon: [
			`<p>Amazon aggregates demand at scale and monetizes it through layered high-margin services such as AWS and advertising.</p>
			<p>Its advantage lies in a self-reinforcing flywheel supported by logistics, data, and infrastructure.</p>
			<p>However, increasing capital intensity and profit concentration highlight emerging structural constraints.</p>`,

			`<p>Amazon serves different roles depending on the user:</p>
			<p><strong>Consumers</strong> → marketplace and content platform<br>
			<strong>Sellers</strong> → distribution channel<br>
			<strong>Brands</strong> → advertising platform<br>
			<strong>Enterprises</strong> → cloud infrastructure (AWS)</p>
			<p>However, these views miss the broader structure.</p>
			<p>Amazon aggregates demand at scale and monetizes it through integrated, high-margin layers.</p>
			<p>Originally launched as an online bookstore, Amazon has evolved into a global platform spanning e-commerce, cloud, and digital advertising.</p>
			<p>This analysis views Amazon as a demand aggregation and monetization platform, where commerce drives traffic and high-margin services capture value.</p>`,

			`<p>Amazon generates revenue through product and service streams, with a structural shift toward higher-margin services.</p>
			<p><strong>Q1 2025:</strong> Services (~$91.7B) > Products (~$63.9B)<br>
			Net income grew ~64% YoY vs ~9–10% revenue growth<br>
			Free cash flow declined (~$50B → ~$25.9B) due to increased capex</p>
			<p>Profit growth significantly outpaces revenue growth, indicating a shift toward high-margin segments.</p>
			<p><strong>Key Dynamics</strong></p>
			<p>Product sales → traffic driver, low margin<br>
			Services (AWS, Ads, Marketplace) → profit driver, high margin</p>
			<p>Despite diversified revenues, profitability remains concentrated in AWS and advertising.</p>`,

			`<p>Amazon converts large-scale traffic into multi-layer monetization through a self-reinforcing system.</p>
			<p><strong>Core Flywheel</strong></p>
			<p><strong>Demand Generation</strong> — Price, delivery speed, selection → traffic<br>
			<strong>Supply Expansion</strong> — Traffic attracts sellers → increased selection<br>
			<strong>Engagement</strong> — Prime, personalization → higher frequency<br>
			<strong>Data Accumulation</strong> — User behavior → improved pricing, targeting<br>
			<strong>Monetization</strong> — Marketplace fees, ads, subscriptions<br>
			<strong>Reinvestment</strong> — Logistics, AI, infrastructure → strengthens system</p>
			<p><strong>AWS (Parallel Engine)</strong></p>
			<p>AWS operates outside the commerce loop but reinforces it:</p>
			<p>Profit engine → funds reinvestment<br>
			Infrastructure layer → enables scale, AI, data processing<br>
			External monetization → cloud services</p>
			<p>Amazon operates a dual-engine model:<br>
			Commerce → demand & data<br>
			AWS → profit & infrastructure</p>
			<p><strong>Key Insights</strong></p>
			<p>Multi-layer monetization increases revenue per interaction.<br>
			Cross-subsidization enables low-margin retail to scale.<br>
			Amazon integrates demand, data, and monetization into a compounding system.</p>`,

			`<p><strong>Core Moats</strong></p>
			<p><strong>Logistics Network</strong> → scaled fulfillment and delivery<br>
			<strong>Data Advantage</strong> → superior pricing, targeting, recommendations<br>
			<strong>Flywheel & Scale</strong> → self-reinforcing growth<br>
			<strong>Ecosystem Lock-in</strong> → Prime drives retention and frequency<br>
			<strong>AWS</strong> → high-margin engine funding reinvestment</p>
			<p><strong>Key Insight</strong></p>
			<p>Amazon's advantage is system-level—each component reinforces the others, making replication difficult without matching scale, infrastructure, and data simultaneously.</p>`,

			`<p><strong>Core Drivers</strong></p>
			<p><strong>AWS & AI</strong> → enterprise cloud + AI workloads<br>
			<strong>Advertising</strong> → monetization of high-intent traffic<br>
			<strong>Marketplace</strong> → expansion of third-party sellers<br>
			<strong>Prime</strong> → increased retention and frequency<br>
			<strong>Logistics</strong> → faster delivery, improved efficiency</p>
			<p><strong>Emerging Drivers</strong></p>
			<p><strong>AI integration</strong> → personalization and automation<br>
			<strong>Global expansion</strong> → rising e-commerce penetration<br>
			<strong>New verticals</strong> → healthcare, media, adjacencies</p>
			<p><strong>Key Insight</strong></p>
			<p>Growth is increasingly driven by scalable, high-margin services layered on top of core commerce.</p>`,

			`<p><strong>i. Declining Capital Efficiency</strong></p>
			<p>Capex: ~$53B → ~$93B (+74%)<br>
			Revenue: ~$590B → ~$650B (~10%)<br>
			Capex / Revenue: ~9% → ~14%</p>
			<p>Capex is scaling significantly faster than revenue, indicating rising capital intensity.</p>
			<p><em>Key Insight:</em> Growth is becoming increasingly capital-intensive, with declining capital efficiency.</p>
			<p><strong>ii. Profit Concentration Risk</strong></p>
			<p>Net income: ~$10.4B → ~$17.1B (~64% growth)<br>
			Revenue growth: ~9–10%<br>
			Profit growth significantly exceeds revenue growth</p>
			<p>Margin expansion is driven by a limited set of high-margin segments.</p>
			<p><em>Key Insight:</em> Amazon exhibits profit concentration, with a disproportionate share of earnings driven by AWS and advertising.</p>`
		],
		Apple: [
			`<p>Apple executive summary goes here.</p>`,
			`<p>Apple overview goes here.</p>`,
			`<p>Apple revenue streams goes here.</p>`,
			`<p>Apple business model goes here.</p>`,
			`<p>Apple competitive advantage goes here.</p>`,
			`<p>Apple growth drivers goes here.</p>`,
			`<p>Apple weakness goes here.</p>`
		],
		Nike: [
			`<p>Nike executive summary goes here.</p>`,
			`<p>Nike overview goes here.</p>`,
			`<p>Nike revenue streams goes here.</p>`,
			`<p>Nike business model goes here.</p>`,
			`<p>Nike competitive advantage goes here.</p>`,
			`<p>Nike growth drivers goes here.</p>`,
			`<p>Nike weakness goes here.</p>`
		],
		Zomato: [
			`<p>Zomato executive summary goes here.</p>`,
			`<p>Zomato overview goes here.</p>`,
			`<p>Zomato revenue streams goes here.</p>`,
			`<p>Zomato business model goes here.</p>`,
			`<p>Zomato competitive advantage goes here.</p>`,
			`<p>Zomato growth drivers goes here.</p>`,
			`<p>Zomato weakness goes here.</p>`
		]
	}

	// --- Panel & Overlay Interaction ---
	const cardsElements = document.querySelectorAll('.card')
	const overlay = document.querySelector('.overlay')
	const panel = document.querySelector('.analysis-panel')
	const panelClose = document.querySelector('.panel-close')
	const panelTitle = document.querySelector('.panel-title')
	const panelSections = document.querySelectorAll('.panel-section')

	const openPanel = (companyName) => {
		lenis.stop()
		panelTitle.textContent = companyName

		// Populate section bodies with company-specific content
		const content = companyData[companyName]
		if (content) {
			panelSections.forEach((section, i) => {
				const body = section.querySelector('.panel-section-body')
				if (body && content[i]) {
					body.innerHTML = content[i]
				}
			})
		}

		gsap.to(overlay, { opacity: 1, pointerEvents: 'auto', duration: 0.5, ease: 'power3.inOut' })
		gsap.to(panel, { x: 0, duration: 0.5, ease: 'power3.inOut' })
	}

	const closePanel = () => {
		lenis.start()
		panel.querySelectorAll('.panel-section.open').forEach(s => s.classList.remove('open'))
		gsap.to(overlay, { opacity: 0, pointerEvents: 'none', duration: 0.5, ease: 'power3.inOut' })
		gsap.to(panel, { x: '100%', duration: 0.5, ease: 'power3.inOut' })
	}

	cardsElements.forEach(card => {
		card.addEventListener('click', () => {
			const companyName = card.getAttribute('data-company')
			openPanel(companyName)
		})
	})

	panelClose.addEventListener('click', closePanel)
	overlay.addEventListener('click', closePanel)

	// --- Accordion Toggle ---
	document.querySelectorAll('.panel-section-header').forEach(header => {
		header.addEventListener('click', () => {
			header.parentElement.classList.toggle('open')
		})
	})

	// --- Prevent Lenis from hijacking panel scroll ---
	panel.addEventListener('wheel', (e) => { e.stopPropagation() }, { passive: true })
	panel.addEventListener('touchmove', (e) => { e.stopPropagation() }, { passive: true })

	// --- Outro Animations (ScrollTrigger) ---
	const outroTl = gsap.timeline({
		scrollTrigger: {
			trigger: '.outro',
			start: 'top 80%',
			once: true
		}
	})

	outroTl
		.to('.outro-closing', { opacity: 1, duration: 0.8, ease: 'power2.out' })
		.to('.college-card', { opacity: 1, y: 0, duration: 0.6, stagger: 0.2, ease: 'power2.out' }, '-=0.3')
		.to('.contact-buttons', { opacity: 1, duration: 0.8, ease: 'power2.out' }, '-=0.2')
})
