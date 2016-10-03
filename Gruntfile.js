module.exports = function(grunt) {
    grunt.initConfig({
        mocha_istanbul: {
            // Pass all JS unit tests through mocha.
            // Also generate coverage for all JS files which were loaded.
            coverage: {
                src: 'test',
                options: {
                    mask: '*.js',
                    coverageFolder: 'coverage/js',
                    istanbulOptions: [
                        '--hook-run-in-context'
                    ],
                }
            },
            test: {
                src: 'test',
                options: {
                    mask: '*.js',
                    coverage: false,
                }
            },
        },
        umd: {
            all: {
                options: {
                    src: 'build/tour.js',
                    dest: 'build/tour.js',
                    objectToExport: 'Tour',
                    deps: {
                        default: ['$', 'Popper'],
                        amd: [
                            {'jquery': '$'},
                            {'tool_usertours/popper': 'Popper'}
                        ],
                        cjs: ['jquery', 'popper.js']
                    }
                }
            }
        },
        watch: {
            js: {
                files: ["src/*.js"],
                tasks: ["js"]
            },
            tests: {
                files: ["test/*.js", "testFramework.js"],
                tasks: ["mocha_istanbul:coverage"],
            }
        },
        babel: {
            options: {
                sourceMap: false,
            },
            dist: {
                files: {
                    "build/tour.js": "src/tour.js",
                }
            }
        },
        concat: {
            options: {
                banner: "// jshint ignore: start\n",
            },
            dist: {
                src: ['build/tour.js'],
                dest: 'build/tour.js',
            }
        },
    });
    grunt.loadNpmTasks('grunt-mocha-istanbul');
    grunt.loadNpmTasks('grunt-babel');
    grunt.loadNpmTasks('grunt-umd');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.registerTask("transpile", ["babel"]);
    grunt.registerTask("js", ["transpile", "umd:all", "concat", "test"]);
    grunt.registerTask("test", ["mocha_istanbul:coverage"]);
    grunt.registerTask("default", ["js", "watch"]);
};
