import _ from 'lodash';
import sinon from 'sinon';
import { graphql } from 'graphql';
import { toGlobalId } from 'graphql-relay';
import schema from '../../schema';

describe('Object Identification', () => {
  const tests = {
    Article: {
      positron: {
        title: 'Nightlife at the Foo Bar',
        author: 'Artsy Editorial',
      },
    },
    Artist: {
      gravity: {
        birthday: null,
        artworks_count: 42,
      },
    },
    Artwork: {
      gravity: {
        title: 'For baz',
        artists: null,
      },
    },
    Partner: {
      gravity: {
        has_full_profile: true,
        shows_count: 42,
      },
    },
    PartnerShow: {
      gravity: {
        displayable: true, // this is only so that the show doesn’t get rejected
        partner: { id: 'for-baz' },
        display_on_partner_profile: true,
      },
    },
  };

  _.keys(tests).forEach((typeName) => {
    describe(`for a ${typeName}`, () => {
      const fieldName = _.snakeCase(typeName);
      const type = schema.__get__(typeName);
      const api = _.keys(tests[typeName])[0];
      const payload = tests[typeName][api];

      beforeEach(() => {
        type.__Rewire__(api, sinon.stub().returns(
          Promise.resolve(_.assign({ id: 'foo-bar' }, payload))
        ));
      });

      afterEach(() => {
        type.__ResetDependency__(api);
      });

      it('generates a Global ID', () => {
        const query = `
          {
            ${fieldName}(id: "foo-bar") {
              __id
            }
          }
        `;

        return graphql(schema, query).then(({ data }) => {
          const expectedData = {};
          expectedData[fieldName] = { __id: toGlobalId(typeName, 'foo-bar') };
          data.should.eql(expectedData);
        });
      });

      it('resolves a node', () => {
        const query = `
          {
            node(__id: "${toGlobalId(typeName, 'foo-bar')}") {
              __typename
              ... on ${typeName} {
                id
              }
            }
          }
        `;

        return graphql(schema, query).then(({ data }) => {
          data.should.eql({
            node: {
              __typename: typeName,
              id: 'foo-bar',
            },
          });
        });
      });
    });
  });

  describe('for a HomePageModule', () => {
    describe('with a specific module', () => {
      const globalId = toGlobalId(
        'HomePageModule',
        JSON.stringify({ key: 'iconic_artists' })
      );

      it('generates a Global ID', () => {
        const query = `
          {
            home_page {
              artwork_module(key: "iconic_artists") {
                __id
              }
            }
          }
        `;

        return graphql(schema, query).then(({ data }) => {
          data.should.eql({
            home_page: {
              artwork_module: {
                __id: globalId,
              }
            },
          });
        });
      });

      it('resolves a node', () => {
        const query = `
          {
            node(__id: "${globalId}") {
              __typename
              ... on HomePageModule {
                key
              }
            }
          }
        `;

        return graphql(schema, query).then(({ data }) => {
          data.should.eql({
            node: {
              __typename: 'HomePageModule',
              key: 'iconic_artists',
            },
          });
        });
      });
    });

    describe('with a generic gene', () => {
      const globalId = toGlobalId(
        'HomePageModule',
        JSON.stringify({ key: 'generic_gene', id: 'abstract-art' })
      );

      it('generates a Global ID', () => {
        const query = `
          {
            home_page {
              artwork_module(key: "generic_gene", id: "abstract-art") {
                __id
              }
            }
          }
        `;

        return graphql(schema, query).then(({ data }) => {
          data.should.eql({
            home_page: {
              artwork_module: {
                __id: globalId,
              }
            },
          });
        });
      });

      it('resolves a node', () => {
        const query = `
          {
            node(__id: "${globalId}") {
              __typename
              ... on HomePageModule {
                key
                params {
                  id
                }
              }
            }
          }
        `;

        return graphql(schema, query).then(({ data }) => {
          data.should.eql({
            node: {
              __typename: 'HomePageModule',
              key: 'generic_gene',
              params: {
                id: 'abstract-art',
              },
            },
          });
        });
      });
    });
  });

  describe('for a HomePageArtistModule', () => {
    const globalId = toGlobalId(
      'HomePageArtistModule',
      JSON.stringify({ key: 'trending' })
    );

    it('generates a Global ID', () => {
      const query = `
        {
          home_page {
            artist_module(key: "trending") {
              __id
            }
          }
        }
      `;

      return graphql(schema, query).then(({ data }) => {
        data.should.eql({
          home_page: {
            artist_module: {
              __id: globalId,
            }
          },
        });
      });
    });

    it('resolves a node', () => {
      const query = `
        {
          node(__id: "${globalId}") {
            __typename
            ... on HomePageArtistModule {
              key
            }
          }
        }
      `;

      return graphql(schema, query).then(({ data }) => {
        data.should.eql({
          node: {
            __typename: 'HomePageArtistModule',
            key: 'trending',
          },
        });
      });
    });
  });
});
