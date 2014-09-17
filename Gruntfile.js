'use strict';
module.exports = function(grunt) {
  // Load all tasks
  require('load-grunt-tasks')(grunt);
  // Show elapsed time
  require('time-grunt')(grunt);

  var jsFileList = [
    'js/plugins/*.js',
    'js/_*.js'
  ];

  grunt.initConfig({
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      all: [
        'Gruntfile.js',
        'js/*.js',
        '!js/scripts.js',
        '!**/*.min.*'
      ]
    },
    cssmin : {
      compress : {
        files : {
          "css/main.min.css" : ['css/main.css']
        }
      }
    },
    concat: {
      options: {
        separator: ';',
      },
      dist: {
        src: [jsFileList],
        dest: 'js/scripts.js',
      },
    },
    uglify: {
      dist: {
        files: {
          'js/scripts.min.js': [jsFileList]
        }
      }
    },
    autoprefixer: {
      options: {
        browsers: ['last 2 versions', 'ie 8', 'ie 9', 'android 2.3', 'android 4', 'opera 12']
      },
      dev: {
        options: {
          map: {
            prev: 'css/'
          }
        },
        src: 'css/styles.css'
      },
      build: {
        src: 'css/main.min.css'
      }
    },
    modernizr: {
      build: {
        devFile: 'js/modernizr.js',
        outputFile: 'js/modernizr.min.js',
        files: {
          'src': [
            ['js/scripts.min.js'],
            ['css/main.min.css']
          ]
        },
        uglify: true,
        parseFiles: true
      }
    },
    watch: {
      cssmin: {
        files: [
          'css/*.css'
        ],
        tasks: ['cssmin', 'autoprefixer:dev']
      },
      js: {
        files: [
          jsFileList,
          '<%= jshint.all %>'
        ],
        tasks: ['jshint', 'concat']
      },
      livereload: {
        // Browser live reloading
        // https://github.com/gruntjs/grunt-contrib-watch#live-reloading
        options: {
          livereload: false
        },
        files: [
          'css/styles.css',
          'js/scripts.js',
          '*.html'
        ]
      }
    }
  });

  // Register tasks
  grunt.registerTask('default', [
    'dev'
  ]);
  grunt.registerTask('dev', [
    'jshint',
    'autoprefixer:dev',
    'concat'
  ]);
  grunt.registerTask('build', [
    'jshint',
    'autoprefixer:build',
    'uglify',
    'modernizr',
    'cssmin'
  ]);
};
