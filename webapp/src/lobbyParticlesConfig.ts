export const PARTICLES_CONFIG = {
    fullScreen: { enable: false },
    background: { color: { value: "transparent" } },
    fpsLimit: 40,
    particles: {
        number: { value: 80, density: { enable: true } },
        shape: {
            type: "polygon",
            options: {
                polygon: { sides: 6 },
            },
        },
        color: { value: "#f0b84a" },
        stroke: { width: 1, color: "#6d55e8" },
        fill: { enable: false },
        opacity: { value: { min: 0.6, max: 0.8 } },
        size: { value: { min: 20, max: 30 } },
        move: {
            enable: true,
            speed: 0.8,
            direction: "none" as const,
            random: true,
            outModes: { default: "out" as const },
        },
    },
    detectRetina: true,
} as const;