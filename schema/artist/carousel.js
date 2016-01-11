import _ from 'lodash';
import Image from '../image';
import gravity from '../../lib/loaders/gravity';
import debug from 'debug';
import {
  GraphQLObjectType,
  GraphQLList,
} from 'graphql';

const ArtistCarouselType = new GraphQLObjectType({
  name: 'ArtistCarousel',
  fields: {
    images: {
      type: new GraphQLList(Image.type),
      resolve: images => images,
    },
  },
});

const ArtistCarousel = {
  type: ArtistCarouselType,
  resolve: (artist) => {
    return Promise.all([
      gravity('related/shows', {
        artist_id: artist.id,
        sort: '-end_at',
        displayable: true,
        solo_show: true,
        top_tier: true,
      }),
      gravity(`artist/${artist.id}/artworks`, {
        size: 7,
        sort: '-iconicity',
        published: true,
      }),
    ]).then(([shows, artworks]) => {
      const elligibleShows = shows.filter(show => show.images_count > 0);
      return Promise.all(
        elligibleShows.map(show => gravity(`partner_show/${show.id}/images`, { size: 1 }))
      )
      .then(showImages => {
        return _.zip(elligibleShows, showImages).map(([show, images]) => {
          return _.assign({ href: `/show/${show.id}` }, _.first(images));
        });
      })
      .then(showsWithImages => {
        return showsWithImages.concat(
          artworks.map(artwork => {
            return _.assign({ href: `/artwork/${artwork.id}` }, _.first(artwork.images));
          })
        );
      });
    })
    .catch(debug('error'));
  },
};

export default ArtistCarousel;
