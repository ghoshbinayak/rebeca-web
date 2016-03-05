var REBECA = (function(){
    var container;
    var camera, scene, renderer, circleUniforms, composer, sceneClear, cameraClear;
    var circlePoints, rebecaLogo, logoDate, logoButton, mainPage, staticNav;

    var windowHalfX = window.innerWidth / 2;
    var windowHalfY = window.innerHeight / 2;

    var STEP_CIRCLE_PARTICLE_AMOUNT_PER_DEGREE = 100;
    var PARTICLE_FIELD_SEGMENT_SIZE = 200;
    var PARTICLE_FIELD_GRID_SIZE = 2e3;
    var PARTICLE_FIELD_GRID_SEG = 3;
    var CIRCLE_SPEED = {
        value: 0.008
    };
    var CIRCLE_SHOWN = true;

    var A = PARTICLE_FIELD_GRID_SEG; 
    var O = PARTICLE_FIELD_GRID_SIZE;
    var M = O * A;
    var _ = -M / 2;

    var s;
    var offsetLeft = 0, 
    offsetTop = 35, 
    currentStep = 0;

    var loader = new THREE.TextureLoader();
    var texture;
    loader.load( "img/colorMap.png", function(loadedtexture, textureData){
        texture = loadedtexture;
        init();
        animate();
        loadingWriteUp();
        EKTweener.to(circleUniforms.fading, 5, { value: 1, ease: "easeInSine"});
        EKTweener.to(CIRCLE_SPEED, 10, { value: 0.004, ease: "easeInSine"});
        EKTweener.to(circleUniforms.animationRatio, 10, {value: 1, ease: "easeInSine"});
        setTimeout(function(){ 
            logoButton.style.display ="block";
            logoDate.style.display ="block";
            EKTweener.to(camera.position, 5, {y: 300, ease: "easeOutExpo"});
            EKTweener.to(circlePoints.position, 5, {y: 330, ease: "easeOutExpo"});
            EKTweener.to(rebecaLogo.style, 5, {opacity: 1, ease: "easeInSine"});            
            EKTweener.to(logoDate.style, 5, {opacity: 1, ease: "easeInSine"});           
            EKTweener.to(logoButton.style, 5, {opacity: 1, ease: "easeInSine"});            
            for (var o = 0, c = A * A; o < c; o++) {
                EKTweener.to(waveUniforms[o].fading, 5, {value: 1, ease: "easeInSine"});
            }
        },  12000);

    }); 

    var waveUniforms = [];

    function createWaveParticles(o, offsetx, offsetz){
        var colormap = texture;
        colormap.needsUpdate = !0,
        colormap.wrapS = colormap.wrapT = THREE.RepeatWrapping;
        waveUniforms[o] = {
            fogColor: {
                type: "c",
                value: new THREE.Color(0)
            },
            fogDensity: {
                type: "f",
                value: 0.025
            },
            fogFar: {
                type: "f",
                value: 2e3
            },
            fogNear: {
                type: "f",
                value: 1
            },
            fading: {
                type: "f",
                value: 0
            },
            colorMap: {
                type: "t",
                value: colormap
            },
            colorMapScale: {
                type: "f",
                value: 1
            },
            time: {
                type: "f",
                value: 0
            },
            zoom: {
                type: "f",
                value: 0
            },
            globalPos: {
                type: "v3",
                value: new THREE.Vector3(0, 0, 0)
            },
            posOffset: {
                type: "v3",
                value: new THREE.Vector3(offsetx, 0, offsetz)
            },
            posFieldOffset: {
                type: "v3",
                value: new THREE.Vector3(offsetx, 0, offsetz)
            },
            cameraVector: {
                type: "v3",
                value: new THREE.Vector3(0, 0, 0)
            },
            dpi: {
                type: "f",
                value: window.devicePixelRatio || 1
            }
        }; 
        var wVshader = "varying float pAlpha;\nvarying vec2 colorMapPos;\nvarying float alphaIntensity;\nvarying float vZoom;\nuniform float fading;\nuniform float time;\nuniform float zoom;\nuniform vec3 globalPos;\nuniform vec3 posOffset;\nuniform vec3 posFieldOffset;\nuniform vec3 cameraVector;\nuniform float dpi;\n\nconst float PI = 3.14159265358979323846264;\n\n//\n// Description : Array and textureless GLSL 2D simplex noise function.\n//      Author : Ian McEwan, Ashima Arts.\n//  Maintainer : ijm\n//     Lastmod : 20110822 (ijm)\n//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.\n//               Distributed under the MIT License. See LICENSE file.\n//               https://github.com/ashima/webgl-noise\n// \n\nvec3 mod289(vec3 x) {\nreturn x - floor(x * (1.0 / 289.0)) * 289.0;\n}\n\nvec2 mod289(vec2 x) {\nreturn x - floor(x * (1.0 / 289.0)) * 289.0;\n}\n\nvec3 permute(vec3 x) {\nreturn mod289(((x*34.0)+1.0)*x);\n}\n\nfloat snoise(vec2 v)\n{\nconst vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0\n0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)\n-0.577350269189626,  // -1.0 + 2.0 * C.x\n0.024390243902439); // 1.0 / 41.0\n// First corner\nvec2 i  = floor(v + dot(v, C.yy) );\nvec2 x0 = v -   i + dot(i, C.xx);\n\n// Other corners\nvec2 i1;\n//i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0\n//i1.y = 1.0 - i1.x;\ni1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);\n// x0 = x0 - 0.0 + 0.0 * C.xx ;\n// x1 = x0 - i1 + 1.0 * C.xx ;\n// x2 = x0 - 1.0 + 2.0 * C.xx ;\nvec4 x12 = x0.xyxy + C.xxzz;\nx12.xy -= i1;\n\n// Permutations\ni = mod289(i); // Avoid truncation effects in permutation\nvec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))\n+ i.x + vec3(0.0, i1.x, 1.0 ));\n\nvec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);\nm = m*m ;\nm = m*m ;\n\n// Gradients: 41 points uniformly over a line, mapped onto a diamond.\n// The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)\n\nvec3 x = 2.0 * fract(p * C.www) - 1.0;\nvec3 h = abs(x) - 0.5;\nvec3 ox = floor(x + 0.5);\nvec3 a0 = x - ox;\n\n// Normalise gradients implicitly by scaling m\n// Approximation of: m *= inversesqrt( a0*a0 + h*h );\nm *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );\n\n// Compute final noise value at P\nvec3 g;\ng.x  = a0.x  * x0.x  + h.x  * x0.y;\ng.yz = a0.yz * x12.xz + h.yz * x12.yw;\nreturn 130.0 * dot(m, g);\n}\n/*EVAL THREE.ShaderChunk['snoise2d'];*/\nvoid main() {\nvec3 refPos = position + posFieldOffset;\ncolorMapPos = refPos.xz;\n\n// noise ratio that fixed depends on the particle reference position\nfloat fixedPosNoiseRatio =\n(snoise(refPos.xz * 0.1) + snoise(refPos.xz * 0.005)) * .5;\nfixedPosNoiseRatio = 1.0 - (cos(fixedPosNoiseRatio * PI) + 1.0) / 2.0 -\nsnoise(refPos.xz * .1) - snoise(refPos.xz * .03);\nfixedPosNoiseRatio -= snoise(refPos.xz * .003 + 2.1) * 1.5 +\nsnoise(refPos.xz * .3 + 1.1) +\nsnoise(refPos.xz * .001 + 1.1);\n\nfixedPosNoiseRatio *= .5;\nvec3 pos = position + posOffset;\nvec4 modelViewPos = modelViewMatrix * vec4(pos + cameraVector, 1.0);\nfloat distanceToCamera =\nsqrt(modelViewPos.x * modelViewPos.x + modelViewPos.z * modelViewPos.z);\nfloat offsetY = snoise(refPos.xz * 0.0013 + 4.0) * -40.00 +\nsnoise(refPos.xz * 0.0006 + 32.0) * -90.0;\npos.x += (snoise(refPos.xz * 0.3) - .5) * 8.0;\npos.y += offsetY + snoise(refPos.xz * 200. + 12.) * 10.0 +\n(1. - step(0., fixedPosNoiseRatio)) * 99999.;\npos.z += (snoise(refPos.xz * 0.4) - .5) * 8.0;\nmodelViewPos = modelViewMatrix * vec4(pos, 1.0);\ndistanceToCamera =\nsqrt(modelViewPos.x * modelViewPos.x + modelViewPos.y * modelViewPos.y +\nmodelViewPos.z * modelViewPos.z);\nfloat blinkRatio = step(.1, snoise(refPos.xz)) *\nsnoise(refPos.xz * 1.0 + 30.0 + time * 0.05);\npAlpha = clamp(mix(0.5, .6 + .4 * blinkRatio, fixedPosNoiseRatio) * fading *\npow(5., clamp(fixedPosNoiseRatio, 0., 1.)),\n0., 1.);\nalphaIntensity =\n1.0 + abs(snoise(refPos.xz * 400.0) * .8) * (.3 + blinkRatio * .7);\ngl_PointSize = mix(500.0, 5000.0, pow(zoom, 2.1)) / distanceToCamera * 6.0 *\nmix(0.4, 1.0, fixedPosNoiseRatio) * dpi *\n(.8 + blinkRatio * .3);\nvZoom = zoom;\ngl_Position = projectionMatrix * modelViewPos;\n}";
        var wFshader = "varying vec2 colorMapPos;\nvarying float pAlpha;\nvarying float alphaIntensity;\nvarying float vZoom;\n// uniform sampler2D tDiffuse;\nuniform sampler2D colorMap;\nuniform float colorMapScale;\n\n/*EVAL THREE.ShaderChunk['fog_pars_fragment'];*/\n#ifdef USE_FOG\nuniform vec3 fogColor;\n#ifdef FOG_EXP2\nuniform float fogDensity;\n#else\nuniform float fogNear;\nuniform float fogFar;\n#endif\n#endif\n\nfloat clampNorm(float val, float min, float max) {\nreturn clamp((val - min) / (max - min), 0.0, 1.0);\n}\n\n\nvoid main() {\n\nfloat colorMapScale = 200.0 * colorMapScale;\n\ngl_FragColor = texture2D( colorMap, mod(colorMapPos, colorMapScale) / colorMapScale);\n\nfloat distanceToCenter = length(gl_PointCoord.xy - .5) * 2.;\n\ngl_FragColor.a = (step(0., distanceToCenter) - step(.25, distanceToCenter)) * 1.;\ngl_FragColor.a += (step(.25, distanceToCenter) - step(.27, distanceToCenter)) * mix(1., .4, (distanceToCenter - .25) / (.27 - .25));\ngl_FragColor.a += (step(.27, distanceToCenter) - step(.3, distanceToCenter)) * mix(.4, .15, (distanceToCenter - .27) / (.3 - .27));\ngl_FragColor.a += (step(.3, distanceToCenter) - step(1., distanceToCenter)) * mix(.15, 0., (distanceToCenter - .3) / (1. - .3));\n\ngl_FragColor.a = pow(abs(gl_FragColor.a), alphaIntensity) * pAlpha * ( 1. - clampNorm(vZoom, .75, 1.) * .4);\n\n/*EVAL THREE.ShaderChunk['fog_fragment'];*/\n#ifdef USE_FOG\nfloat depth = gl_FragCoord.z / gl_FragCoord.w;\n#ifdef FOG_EXP2\nconst float LOG2 = 1.442695;\nfloat fogFactor = exp2( - fogDensity * fogDensity * depth * depth * LOG2 );\nfogFactor = 1.0 - clamp( fogFactor, 0.0, 1.0 );\n#else\nfloat fogFactor = smoothstep( fogNear, fogFar, depth );\n#endif\ngl_FragColor = mix( gl_FragColor, vec4( fogColor, gl_FragColor.w ), fogFactor );\n#endif\n}";

        waveMaterial = new THREE.ShaderMaterial({
            uniforms: waveUniforms[o],
            vertexShader: wVshader,
            fragmentShader: wFshader,
            blending: THREE.AdditiveBlending,
            transparent: !0,
            depthTest: !1,
            fog: !0
        });

        var waveParticles = new THREE.Geometry();
        var wn = waveParticles.vertices,
        wi, ws, wo, wu = PARTICLE_FIELD_SEGMENT_SIZE,
        wa = PARTICLE_FIELD_GRID_SIZE,
        wf = wa / wu;
        for (wi = 0; wi < wu; wi++) {
            wo = wi * wf;
            for (ws = 0; ws < wu; ws++) 
                wn.push(new THREE.Vector3(wo, 0, ws * wf));
        }
        var wavePoints = new THREE.Points(waveParticles, waveMaterial);
        wavePoints.position.y = 0;
        sceneClear.add(wavePoints);
        moveWave(o, 0, 0);
    }

    THREE.CustomShader = {
        uniforms: {
            tDiffuse: {
                type: "t",
                value: null
            },
            time: {
                type: "f",
                value: 0
            },
            alpha: {
                type: "f",
                value: 0.05 
            },
            gradientOffset: {
                type: "f",
                value: 0
            },
            gradientOpacity: {
                type: "f",
                value: 0.1
            },
            vRadius: {
                type: "f",
                value: 1
            },
            vSoftness: {
                type: "f",
                value: 1
            },
            zoom: {
                type: "f",
                value: 0
            },
            opacity: {
                type: "f",
                value: 1
            },
            vAlpha: {
                type: "f",
                value: 0.36
            }
        },
        vertexShader: "varying vec2 vUv;\nvoid main() {\n    vUv = uv;\n    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n}\n",
        fragmentShader: "precision mediump float;\nuniform sampler2D tDiffuse;\nuniform float time;\nuniform float alpha;\nuniform float gradientOffset;\nuniform float gradientOpacity;\nuniform float vRadius;\nuniform float vSoftness;\nuniform float vAlpha;\nuniform float zoom;\nuniform float opacity;\n\n\nconst float PI = 3.14159265358979323846264;\n\n\nvarying vec2 vUv;\nfloat rand(vec2 co){\n    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);\n}\nvoid main() {\n    vec4 color = texture2D(tDiffuse, vUv);\n\n    color.rgb = mix(color.rgb, vec3(.043, .043, .043), 1.0 - opacity);\n\n    float r = rand(gl_FragCoord.xy + rand(gl_FragCoord.yx + time));\n    color.rgb = mix(color.rgb, vec3(r, r, r), alpha);\n\n    // radial gradient\n    // float distanceToGradientCenter = clamp(length((vUv - vec2(.5, .5 + zoom + .5)) * 2.0), 0., 1.);\n    // color.rgb = mix(color.rgb, mix(color.rgb, vec3(.909, .945,.95), .1), 1. - smoothstep(0., 1., distanceToGradientCenter));\n\n    // linear gradient\n    float linearGradientRatio = clamp((1. - vUv.y * (.85 + sin((vUv.x * 1.0 * PI + gradientOffset )) * .05) + pow(zoom, 1.3)) * 2., 0., 1.);\n    color.rgb = mix(color.rgb, mix(color.rgb, vec3(.909, .945,.95), gradientOpacity), 1. - smoothstep(0., 1., linearGradientRatio));\n\n    vec2 posToCenter = (vUv - vec2(.5, .5)) * 2.0;\n    float len = length(posToCenter);\n    float vignette = smoothstep(vRadius, vRadius-vSoftness, len);\n    color.rgb = mix(color.rgb, color.rgb * vignette, vAlpha);\n    gl_FragColor = color;\n}\n"
    };

    function init() {
        container = document.createElement( 'div' );
        document.getElementById('canvas-container').appendChild( container );
        camera = new THREE.PerspectiveCamera( 100, window.innerWidth/window.innerHeight, 1, 3000 );
        camera.position.y = -200;
        camera.position.z = 250;
        scene = new THREE.Scene();
        sceneClear = new THREE.Scene();

		// The Object
        var circleParticles = new THREE.Geometry();

        var nVertices = STEP_CIRCLE_PARTICLE_AMOUNT_PER_DEGREE*360;
        var a, u;
        var r = circleParticles.vertices;
        var s = STEP_CIRCLE_PARTICLE_AMOUNT_PER_DEGREE;
        for (var i = 0; i < nVertices; i++){
            a = i / 180 * Math.PI;
            u = 1 + ~~(i / nVertices * s) / s;
            r.push(new THREE.Vector3(Math.sin(a) * u, Math.cos(a) * u, 0));
        }

        var vShader = "varying float pAlpha;\nuniform float time;\nuniform float extraTime;\nuniform vec4 stepTimes;\nuniform vec4 stepExtraTimes;\nuniform float animationRatio;\nuniform float focusRatio;\nuniform float amountPerDegree;\nuniform float opacity;\nuniform float fading;\nuniform float dpi;\n\n\n//\n// Description : Array and textureless GLSL 2D simplex noise function.\n//      Author : Ian McEwan, Ashima Arts.\n//  Maintainer : ijm\n//     Lastmod : 20110822 (ijm)\n//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.\n//               Distributed under the MIT License. See LICENSE file.\n//               https://github.com/ashima/webgl-noise\n// \n\nvec3 mod289(vec3 x) {\nreturn x - floor(x * (1.0 / 289.0)) * 289.0;\n}\n\nvec2 mod289(vec2 x) {\nreturn x - floor(x * (1.0 / 289.0)) * 289.0;\n}\n\nvec3 permute(vec3 x) {\nreturn mod289(((x*34.0)+1.0)*x);\n}\n\nfloat snoise(vec2 v)\n{\nconst vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0\n0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)\n-0.577350269189626,  // -1.0 + 2.0 * C.x\n0.024390243902439); // 1.0 / 41.0\n// First corner\nvec2 i  = floor(v + dot(v, C.yy) );\nvec2 x0 = v -   i + dot(i, C.xx);\n\n// Other corners\nvec2 i1;\n//i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0\n//i1.y = 1.0 - i1.x;\ni1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);\n// x0 = x0 - 0.0 + 0.0 * C.xx ;\n// x1 = x0 - i1 + 1.0 * C.xx ;\n// x2 = x0 - 1.0 + 2.0 * C.xx ;\nvec4 x12 = x0.xyxy + C.xxzz;\nx12.xy -= i1;\n\n// Permutations\ni = mod289(i); // Avoid truncation effects in permutation\nvec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))\n+ i.x + vec3(0.0, i1.x, 1.0 ));\n\nvec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);\nm = m*m ;\nm = m*m ;\n\n// Gradients: 41 points uniformly over a line, mapped onto a diamond.\n// The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)\n\nvec3 x = 2.0 * fract(p * C.www) - 1.0;\nvec3 h = abs(x) - 0.5;\nvec3 ox = floor(x + 0.5);\nvec3 a0 = x - ox;\n\n// Normalise gradients implicitly by scaling m\n// Approximation of: m *= inversesqrt( a0*a0 + h*h );\nm *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );\n\n// Compute final noise value at P\nvec3 g;\ng.x  = a0.x  * x0.x  + h.x  * x0.y;\ng.yz = a0.yz * x12.xz + h.yz * x12.yw;\nreturn 130.0 * dot(m, g);\n}\n\nfloat PI = 3.14159265358979323846264;\n/*EVAL THREE.ShaderChunk['snoise2d'];*/\n\nfloat clampNorm(float val, float min, float max) {\nreturn clamp((val - min) / (max - min), 0.0, 1.0);\n}\n\nfloat easeOutBack(float t) {\nreturn ((t=t-1.)*t*((2.70158)*t + 1.70158) + 1.);\n}\n\nvoid main() {\nvec3 pos = position;\nfloat baseAngle = atan(pos.y, pos.x);\nfloat baseRadius = sqrt(pos.x * pos.x + pos.y * pos.y) - 1.0;\n\n// 9 groups\nfloat group = mod(floor(baseRadius * amountPerDegree), 9.0);\nfloat angle = baseAngle;\nfloat radius = baseRadius * 30.0 + 155.0;\nfloat angleFinalOffset = (time + extraTime) * .1;\nfloat tmpRatio;\nfloat tmp;\npAlpha = 1.0;\n\n// tmpRatio = clampNorm(animationRatio, 0., 1.);\ntmpRatio = 1.;//easeOutBack(clamp(1. - abs(animationRatio - 2.), 0., 1.));\nfloat stepTime = time;// stepTimes.x + stepExtraTimes.x;\nif(group > 2.) {\nif(angle > PI / 2.0) {\ntmp = PI;\n} else if(angle < -PI / 2.0) {\ntmp = -PI;\n} else {\ntmp = 0.;\n}\n\nangle = mix(angle, mix(angle, tmp, .85), (tmpRatio + snoise(position.xy * 30. + time * (.1 + group * .03))) * tmpRatio / 2.);\nradius += ((snoise(position.xy * 15.) * 2. - 1.) * (sin(radius * group * 3.0) + 1.) * 10. + 18.)* tmpRatio;\nangleFinalOffset += (mod(group, 3.) * .01 * mod(group, 2.) ) * (tmpRatio  + stepTime);\n\n} else {\nangleFinalOffset += (group * .02) * (tmpRatio  + stepTime);\n// angle += time * tmpRatio * .2;\nradius += (30. + snoise(position.xy * 400.) * 20. * group  + (baseRadius - .5) * (50. + group * 20. + abs(cos(baseAngle)) * snoise(position.xy * 200.) *30.)) * tmpRatio;\n}\n\ntmpRatio = clampNorm(animationRatio, 2., 3.);\nradius = mix(radius, 150. + baseRadius * (255. + group * 10.), easeOutBack(pow(tmpRatio, 1. + group * .2 + snoise(position.xy * 312.))));\nradius += clampNorm(baseRadius, .75, 1.) * 100. * snoise(position.xy * 230. + 15.) * tmpRatio;\ntmpRatio = clampNorm(animationRatio, 3., 4.);\nradius *= 1.0 + tmpRatio * abs(snoise(position.xy * 35. + 41.));\n\n// focus\nangle -= focusRatio * PI * (.1 + group * .03);\nradius = mix(radius, 160., (easeOutBack(focusRatio) * .8 + snoise(position.xy * 200.0) * .3) * pow(abs(easeOutBack(focusRatio)), 1.0 + group));\n\npos.x = sin(angle) * radius;\npos.y = cos(angle) * radius;\n\ntmpRatio = 1.;//clampNorm(animationRatio, 1., 2.);\npos.x += (snoise(position.xy *90. + time * .3) * 10.) * (tmpRatio - (focusRatio));\npos.y += (snoise(position.xy *90. + time * .3 + 2.)  * 10.) * (tmpRatio - (focusRatio));\n\nangleFinalOffset += .1 * (tmpRatio  + stepTime);\npos.x += snoise(position.xy * 100.0) * 3.0;\npos.y += snoise(position.xy * 100.0 + 3.0) * 3.0;\n\n\n\ntmpRatio = clampNorm(animationRatio, 3., 4.);\npos.x += tmpRatio * (abs(snoise(position.xy * 26. + 31.)) - .5) * 20.;\npos.y += tmpRatio * (abs(snoise(position.xy * 41. + 26.)) - .5) * 20.;\n\n\n\nangle = atan(pos.y, pos.x) + angleFinalOffset;\nradius = sqrt(pos.x * pos.x + pos.y * pos.y);\npos.x = sin(angle) * radius;\npos.y = cos(angle) * radius;\n\n\ntmpRatio = 1.;//clampNorm(animationRatio, 1., 2.);\nif(group > 1.) {\npAlpha = tmpRatio;\n}\n\ntmpRatio = 1.;//clamp(1. - abs(animationRatio - 2.), 0., 1.);\nif(mod(group, 3.) > 0.) {\npAlpha -= sin((radius + snoise(position.xy * 12.) * 10.0) * mix(.2, .25, tmpRatio)) / pow(1.0 + baseRadius, 3.0) * tmpRatio;\n}\n\n\ntmpRatio = clampNorm(animationRatio, 2., 3.);\npAlpha *= 1. - tmpRatio * .4;\ntmpRatio = clampNorm(animationRatio, 3.75, 4.);\n\npAlpha *= 1. - tmpRatio;\ntmpRatio = clampNorm(animationRatio, 0., 1.);\nangle = mod(angle + PI * 2., PI * 2.);\n\nfloat maskCenterAngle = mod(time * 2. + PI, PI * 2.);\nfloat deltaAngle = mod(angle - maskCenterAngle + PI * 2., PI * 2.);\nfloat maskStart = tmpRatio * PI / 2.;\nfloat maskEnd = PI / 3. + tmpRatio * PI;\nfloat alpha = 1. - clampNorm( step(0., deltaAngle) * deltaAngle + (1. - step(0., deltaAngle)) * (deltaAngle + PI * 2.), maskStart, maskEnd);\n\nmaskStart = PI * 2. - tmpRatio * PI / 2.;\nmaskEnd = PI * 2. - PI / 3. - tmpRatio * PI;\nalpha += 1. - clampNorm( step(0., deltaAngle) * deltaAngle + (1. - step(0., deltaAngle)) * (deltaAngle + PI * 2.), maskStart, maskEnd);\n\npAlpha *= pow(clamp(alpha, 0., 1.), 1. + group * .2);\n\ntmpRatio = step(.2, animationRatio) * clamp(1. - abs(animationRatio + 2. - 2.), 0., 1.);\n\nif(tmpRatio > .0 && radius < tmpRatio * 155.) {\npAlpha = .0;\n\n}\n\npAlpha = clamp(pAlpha, .0, 1.0) * .2 * opacity * fading;\nvec4 modelViewPos = modelViewMatrix * vec4( pos, 1.0 );\nfloat distanceToCamera = sqrt(modelViewPos.x * modelViewPos.x + modelViewPos.y * modelViewPos.y + modelViewPos.z * modelViewPos.z);\ngl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );\ngl_PointSize = 1. * dpi;\n\n}\n";
        var fShader = "/**\n* Set the colour to a lovely pink.\n* Note that the color is a 4D Float\n* Vector, R,G,B and A and each part\n* runs from 0.0 to 1.0\n*/\n// same name and type as VS\n\nvarying float pAlpha;\n\nvoid main() {\ngl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);\ngl_FragColor.a *= pAlpha;\n}";
        circleUniforms = {
            amountPerDegree: {
                type: "f",
                value: 100 
            },
            time: {
                type: "f",
                value: 0
            },
            extraTime: {
                type: "f",
                value: 0
            },
            animationRatio: {
                type: "f",
                value: 0
            },
            focusRatio: {
                type: "f",
                value: 0
            },
            opacity: {
                type: "f",
                value: 1
            },
            fading: {
                type: "f",
                value: 0
            },
            dpi: {
                type: "f",
                value: window.devicePixelRatio || 1
            },
            stepTimes: {
                type: "v4",
                value: new THREE.Vector4(0, 0, 0, 0)
            },
            stepExtraTimes: {
                type: "v4",
                value: new THREE.Vector4(0, 0, 0, 0)
            }
        };

        var circleMaterial =
        new THREE.ShaderMaterial({
            vertexShader:   vShader,
            fragmentShader: fShader,
            uniforms: circleUniforms,
            blending: THREE.AdditiveBlending,
            transparent: !0,
            depthTest: !1
        });

        circlePoints = new THREE.Points( circleParticles, circleMaterial );


        circlePoints.position.y = -170;
        sceneClear.add( circlePoints );


        for (var o = 0, c = A * A; o < c; o++) {
            createWaveParticles(o, _ + o % A * O, _ + Math.floor(o / A) * O);
        }

        sceneClear.fog = new THREE.FogExp2(460551, 6e-4);

        renderer = new THREE.WebGLRenderer({
            antialias: !0,
            targetHorizontalRotation: !0,
            sortObjects: !1
        });
        renderer.autoClear = !1;
        renderer.setClearColor(460551, 1);

        composer = new THREE.EffectComposer( renderer );
        var h  = new THREE.RenderPass( scene, camera ),
        mt = new THREE.ShaderPass(THREE.RGBShiftShader),
        yt = new THREE.SavePass(),
        pt = new THREE.ShaderPass(THREE.HorizontalTiltShiftShader),
        dt = new THREE.ShaderPass(THREE.VerticalTiltShiftShader),
        vt = new THREE.ShaderPass(THREE.BlendShader),
        gt = new THREE.ShaderPass(THREE.CustomShader);
        vt.uniforms.tDiffuse2.value = yt.renderTarget;
        gt.noiseSpeed = 0;
        composer.addPass(h);
        composer.addPass(yt);
        composer.addPass(mt);
        composer.addPass(pt);
        composer.addPass(dt);
        composer.addPass(vt);
        composer.addPass(gt);
        gt.renderToScreen = !0;
        mt.uniforms.amount.value = 4e-4;
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        container.appendChild( renderer.domElement );

        mainPage = document.getElementById('content-wrapper');
        rebecaLogo = document.getElementById('landing-logo');
        rebecaLogo.style.width = window.innerHeight*0.4 + "px";
        logoDate = document.getElementById('landing-date');
        logoDate.style.fontSize = window.innerHeight*0.03 + "px";
        logoButton = document.getElementById('landing-button');
        staticNav = document.getElementById('static-nav');
        logoButton.onclick = showSite;
    }

    function moveWave(o, e, t) {
        waveUniforms[o].globalPos.value.x = e;
        waveUniforms[o].globalPos.value.z = t;
    }

    function animate() {
        if(CIRCLE_SHOWN){
            var n = circleUniforms.animationRatio.value - 2 | 0,
            r = circleUniforms.animationRatio.value - currentStep,
            s = circleUniforms.stepTimes.value;
            n == 0 && (s.x += 0.01);
            n == 1 && (s.y += 0.01);
            n == 2 && (s.z += 0.01);
            n == 3 && (s.w += 0.01);
            currentStep = n;
            circleUniforms.time.value += CIRCLE_SPEED.value;    
        }
        
        for (var o = 0, c = A * A; o < c; o++) {
            waveUniforms[o].time.value += 0.2;
        }

        requestAnimationFrame( animate );
        render();
    }

    function render() {
        if(CIRCLE_SHOWN){
            composer.render();
        }
        renderer.render( sceneClear, camera );
    }

    function resizeCanvas(){
        camera.aspect = window.innerWidth/window.innerHeight;
        if(CIRCLE_SHOWN){
            rebecaLogo.style.width = window.innerHeight*0.4 + "px";
        }
        else{
            rebecaLogo.style.width = window.innerWidth*0.15 + "px";            
        }
        logoDate.style.fontSize = window.innerHeight*0.03 + "px";
        camera.updateProjectionMatrix();
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
    }

    function loadingWriteUp(){
        var quote1 = "Memories, even your most precious ones,<br> fade surprisingly quickly.",
            quote2 = "But, some memories <br/> which you hold on to never do.",
            quote3 = "So, to create some more such memories,<br> and to experience the nostalgia...",
            quote4 = "let us indulge,<br> for the 78th time";
        var co = document.getElementById('landing-text-box');
        co.style.opacity = 0;
        co.innerHTML = quote1;
        EKTweener.to(co.style, 1, {opacity: 1, ease: "easeInSine"});
        setTimeout(function(){
            EKTweener.to(co.style, 0.8, {opacity: 0, ease: "easeInSine"});
        }, 3000);
        setTimeout(function(){
            co.innerHTML = quote2;
            EKTweener.to(co.style, 1, {opacity: 1, ease: "easeInSine"});
        }, 4000);
        setTimeout(function(){
            EKTweener.to(co.style, 0.8, {opacity: 0, ease: "easeInSine"});
        }, 6000);
        setTimeout(function(){
            co.innerHTML = quote3;
            EKTweener.to(co.style, 1, {opacity: 1, ease: "easeInSine"});
        }, 7000);
        setTimeout(function(){
            EKTweener.to(co.style, 0.8, {opacity: 0, ease: "easeInSine"});
        }, 9000);
        setTimeout(function(){
            co.innerHTML = quote4;
            EKTweener.to(co.style, 1, {opacity: 1, ease: "easeInSine"});
        }, 10000);
        setTimeout(function(){
            EKTweener.to(co.style, 0.8, {opacity: 0, ease: "easeInSine"});
        }, 12000);
    }

    function showSite(){
        logoButton.style.display = "none";
        rebecaLogo.style.top = "20px";
        rebecaLogo.style.left = "20px";
        rebecaLogo.style.transform = "translateX(0)";
        rebecaLogo.style.width = window.innerWidth*0.15 + "px";
        EKTweener.to(camera.position, 1, {z: 0, ease: "easeOutExpo"});
        EKTweener.to(camera.position, 1, {x: 200, ease: "easeOutExpo"});
        EKTweener.to(logoDate.style, 0.5, {opacity: 0, ease: "easeInSine"});
        CIRCLE_SHOWN = false;
        mainPage.style.display = "block";
        staticNav.style.display = "block";
        mainPage.style.left = "20%";
        mainPage.style.width = "80%";
        mainPage.style.height = "100%";
        mainPage.style.top = "0";
        rebecaLogo.onclick = function () {
            setPage(1);
        };
        rebecaLogo.style.cursor = "pointer";
        EKTweener.to(mainPage.style, 2, {opacity: 1, ease: "easeInSine"});
        startSlideshow();
        initScroll();
        setTimeout(function(){
            sceneClear.remove( circlePoints );
            logoDate.style.display = "none";
            staticNav.style.opacity = 1;
        }, 1000);
    }

    function startSlideshow(){
        $("#slideshow > div:gt(0)").hide();

        setInterval(function() { 
          $('#slideshow > div:first')
            .fadeOut(1000)
            .next()
            .fadeIn(1000)
            .end()
            .appendTo('#slideshow');
        },  5000);

        $("#contact-slide > div:gt(0)").hide();

        setInterval(function() { 
          $('#contact-slide > div:first')
            .fadeOut(1000)
            .next()
            .fadeIn(1000)
            .end()
            .appendTo('#contact-slide');
        },  5000);


        $("#sponsor-slide > div:gt(0)").hide();

        setInterval(function() { 
          $('#sponsor-slide > div:first')
            .fadeOut(1000)
            .next()
            .fadeIn(1000)
            .end()
            .appendTo('#sponsor-slide');
        },  5000);
    }

    function initScroll(){
        $(".main").onepage_scroll({
           sectionContainer: "section",     // sectionContainer accepts any kind of selector in case you don't want to use section
           easing: "ease",                  // Easing options accepts the CSS3 easing animation such "ease", "linear", "ease-in",
                                            // "ease-out", "ease-in-out", or even cubic bezier value such as "cubic-bezier(0.175, 0.885, 0.420, 1.310)"
           animationTime: 1000,             // AnimationTime let you define how long each section takes to animate
           pagination: true,                // You can either show or hide the pagination. Toggle true for show, false for hide.
           updateURL: false,                // Toggle this true if you want the URL to be updated automatically when the user scroll to each page.
           beforeMove: function(index) {},  // This option accepts a callback function. The function will be called before the page moves.
           afterMove: function(index) {},   // This option accepts a callback function. The function will be called after the page moves.
           loop: false,                     // You can have the page loop back to the top/bottom when the user navigates at up/down on the first/last page.
           keyboard: true,                  // You can activate the keyboard controls
           responsiveFallback: false,        // You can fallback to normal page scroll by defining the width of the browser in which
                                            // you want the responsive fallback to be triggered. For example, set this to 600 and whenever
                                            // the browser's width is less than 600, the fallback will kick in.
           direction: "vertical"            // You can now define the direction of the One Page Scroll animation. Options available are "vertical" and "horizontal". The default value is "vertical".  
        });
    }

    function setPage(id){
        $(".main").moveTo(id);
    }

    window.onresize = resizeCanvas;

    return {
        setPage: setPage
    };
})();