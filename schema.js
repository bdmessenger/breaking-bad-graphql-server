const {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLNonNull,
    GraphQLList
} = require('graphql');
const axios = require('axios');

const BASE_URL = 'https://www.breakingbadapi.com';

const CharacterType = new GraphQLObjectType({
    name: 'CharacterQueryType',
    fields: {
        character_id: {
            type: GraphQLInt,
            resolve: (parent) => {
                return parent.char_id;
            }
        },
        name: { type: GraphQLString },
        birthday: { type: GraphQLString },
        occupation: { type: GraphQLList(GraphQLString) },
        image: {
            type: GraphQLString,
            resolve: (parent) => {
                return parent.img;
            }
        },
        status: { type: GraphQLString },
        nickname: { type: GraphQLString },
        appearance: { type: GraphQLList(GraphQLInt) },
        portrayed: { type: GraphQLString },
        category: { type: GraphQLString },
        better_call_saul_appearance: { type: GraphQLList(GraphQLInt) }
    }
})

const EpisodeType = new GraphQLObjectType({
    name: 'EpisodeQueryType',
    fields: {
        episode_id: { type: GraphQLInt },
        title: { type: GraphQLString },
        season: { type: GraphQLInt },
        air_date: { type: GraphQLString },
        characters: { type: GraphQLList(GraphQLString) },
        episode: { type: GraphQLString },
        series: { type: GraphQLString }
    }
})

const QuoteType = new GraphQLObjectType({
    name: 'QuoteQueryType',
    fields: {
        quote_id: { type: GraphQLInt },
        quote: { type: GraphQLString },
        author: { type: GraphQLString },
        series: { type: GraphQLString }
    }
})

const DeathType = new GraphQLObjectType({
    name: 'DeathQueryType',
    fields: {
        death_id: { type: GraphQLInt },
        death: { type: GraphQLString },
        cause: { type: GraphQLString },
        responsible: { type: GraphQLString },
        last_words: { type: GraphQLString },
        season: { type: GraphQLInt },
        episode: { type: GraphQLInt },
        number_of_deaths: { type: GraphQLInt }
    }
})

const RootType = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {

        // Character Fields
        characters: { 
            type: GraphQLList(CharacterType),
            args: {
                limit: { type: GraphQLInt, defaultValue: '' },
                offset: { type: GraphQLInt, defaultValue: '' },
                name: { type: GraphQLString, defaultValue: ''},
                category: { type: GraphQLString, defaultValue: ''}
            },
            resolve: (parent, {limit, offset, name, category}) => (
                axios.get(`${BASE_URL}/api/characters?limit=${limit}&offset=${offset}&category=${category}&name=${name}`).then(res => res.data)
            )
        },
        character: {
            type: CharacterType,
            args: {
                id: { type: GraphQLNonNull(GraphQLInt) },
            },
            resolve: (parent, {id}) => (
                axios.get(`${BASE_URL}/api/characters`).then(res => (
                    res.data.find(character => character.char_id === id)
                ))
            )
        },
        random_chararacter: {
            type: CharacterType,
            resolve: () => (
                axios.get(`${BASE_URL}/api/character/random`).then(res => (
                    res.data[0]
                ))
            )
        },

        // Episode Fields
        episodes: {
            type: GraphQLList(EpisodeType),
            args: {
                series: { type: GraphQLString, defaultValue: ''}
            },
            resolve: (parent, args) => (
                axios.get(`${BASE_URL}/api/episodes?series=${args.series}`).then(res => res.data)
            )
        },
        episode: {
            type: EpisodeType,
            args: {
                id: { type: GraphQLNonNull(GraphQLInt) }
            },
            resolve: (parent, {id}) => (
                axios.get(`${BASE_URL}/api/episodes/${id}`).then(res => res.data.length > 0 && res.data[0])
            )
        },

        // Quote Fields
        quotes: {
            type: GraphQLList(QuoteType),
            args: {
                series: { type: GraphQLString, defaultValue: ''},
                author: { type: GraphQLString, defaultValue: ''}
            },
            resolve: (parent, {series, author}) => (
                axios.get(`${BASE_URL}/api/quotes?series=${series}`).then(res => (
                    res.data.filter(q => {
                        if(author !== '') {
                            return q.author.toLowerCase().includes(author.toLowerCase());
                        }
                        return true;
                    })
                ))
            )
        },
        quote: {
            type: QuoteType,
            args: {
                id: { type: GraphQLNonNull(GraphQLInt) }
            },
            resolve: (parent, {id}) => (
                axios.get(`${BASE_URL}/api/quotes`).then(res => (
                    res.data.find(({quote_id}) => quote_id === id)
                ))
            )
        },
        random_quote: {
            type: QuoteType,
            args: {
                author: { type: GraphQLString, defaultValue: ''}
            },
            resolve: (parent, {author}) => (
                axios.get(`${BASE_URL}/api/quotes`).then(res => {
                    let data = [...res.data];
                    if(author !== '') data = data.filter(q => q.author.toLowerCase().includes(author.toLowerCase()));
                    return data[Math.floor(Math.random() * data.length)];
                })
            )
        },

        // Death Fields
        deaths: {
            type: GraphQLList(DeathType),
            resolve: () => (
                axios.get(`${BASE_URL}/api/deaths`).then(res => res.data)
            )
        },
        death_count: {
            type: new GraphQLObjectType({
                name: 'DeathCount',
                fields: {
                    name: { type: GraphQLString },
                    count: { type: GraphQLInt }
                }
            }),
            args: {
                name: { type: GraphQLString }
            },
            resolve: (parent, {name}) => (
                axios.get(`${BASE_URL}/api/deaths`).then(res => {
                    let data = [...res.data]
                    let responsible = 'overall'

                    if(name) {
                        responsible = data.find(death => death.responsible.toLowerCase().includes(name.toLowerCase())).responsible;
                        data = data.filter(death => death.responsible.includes(responsible));
                    }
                    
                    const deathCount = data.reduce((totalAmount, obj) => {
                        totalAmount += obj.number_of_deaths;
                        return totalAmount;
                    }, 0);

                    return {name: responsible, count: deathCount };
                })
            )
        },
        random_death: {
            type: DeathType,
            resolve: () => (
                axios.get(`${BASE_URL}/api/random-death`).then(res => ({...res.data, number_of_deaths: 1}))
            )
        }
    }
});

module.exports = new GraphQLSchema({
    query: RootType
});