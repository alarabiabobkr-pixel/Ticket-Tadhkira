import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: [
      'dist/**/*',
      'dist-*/**/*',
      'public/**/*',
      'scripts/**/*',
      'node_modules/**/*',
      'src/**/*',
      '*.js',
      '*.cjs',
      '*.ts'
    ]
  },
  firebaseRulesPlugin.configs['flat/recommended']
];
