module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['@babel/preset-env', { targets: { node: 'current' } }],
    ],
    plugins: [
      function () {
        return {
          visitor: {
            MemberExpression(path, state) {
              const { types: t } = state;
              if (
                path.node.object &&
                path.node.object.type === 'MemberExpression' &&
                path.node.object.object &&
                path.node.object.object.type === 'MetaProperty' &&
                path.node.object.object.meta &&
                path.node.object.object.meta.name === 'import' &&
                path.node.object.property &&
                path.node.object.property.name === 'env'
              ) {
                // Replace import.meta.env with globalThis.import.meta.env
                path.replaceWith(
                  t.memberExpression(
                    t.memberExpression(
                      t.memberExpression(
                        t.identifier('globalThis'),
                        t.identifier('import')
                      ),
                      t.identifier('meta')
                    ),
                    path.node.property
                  )
                );
              }
            },
          },
        };
      },
    ],
  };
};

