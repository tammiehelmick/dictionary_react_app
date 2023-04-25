import { StatusBar } from 'expo-status-bar'
import { StyleSheet, TextInput, View, FlatList } from 'react-native' 
import { CheckBox, Text, Input, Button, ButtonGroup } from '@rneui/themed'
import Icon from 'react-native-vector-icons/FontAwesome'
import * as Font from 'expo-font'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useState, useEffect, useRef } from 'react'
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StackActions } from '@react-navigation/native'
import AsyncStorage from "@react-native-async-storage/async-storage"
import GameWords from '../assets/words.json'
import RandomWords from '../assets/randomwords.json'

// all regexs tested with regex101.com

async function cacheFonts(fonts) {
    return fonts.map(async (font) => await Font.loadAsync(font))
}

const Stack = createNativeStackNavigator()

export default function App() {
    let [currentQuestion, setCurrentQuestion] = useState(0)
    let [answers, setAnswers] = useState([])
    let [userSearchedWord, setUserSearchedWord] = useState("")
    let [whichGame, setWhichGame] = useState("")
    let [score, setScore] = useState(0)
    let [questionNumber, setQuestionNumber] = useState(0)
    
    // useEffect(() => {
    //     async function getValue() {
    //         const value = await AsyncStorage.getItem('@questions')
    //         if (value === null) {
    //             await AsyncStorage.setItem('@questions', JSON.stringify(questions))
    //         } else {
    //             setQuestions(JSON.parse(value))
    //         }
    //     }
    //     getValue()
    // }, [])
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Dictionary">
                <Stack.Screen name="Dictionary" options={{ headerTitleAlign: 'center'}}>
                    {(props) => <DictionaryScreen {...props} userSearchedWord={userSearchedWord} setUserSearchedWord={setUserSearchedWord} score={score} setScore={setScore} questionNumber={questionNumber} setQuestionNumber={setQuestionNumber}/>}
                </Stack.Screen>
                <Stack.Screen name="Search Results" options={{ headerTitleAlign: 'center'}}>
                    {(props) => <SearchResultsScreen {...props} userSearchedWord={userSearchedWord} setSearchedWord={setUserSearchedWord}/>}
                </Stack.Screen>
                <Stack.Screen name="Matching Game" options={{ headerTitleAlign: 'center'}}>
                    {(props) => <MatchingGameScreen {...props} score={score} setScore={setScore} questionNumber={questionNumber} setQuestionNumber={setQuestionNumber} />}
                </Stack.Screen>
                <Stack.Screen name="Summary" options={{ headerTitleAlign: 'center', headerLeft: ()=> null}} >
                    {(props) => <SummaryScreen {...props} score={score} setScore={setScore} questionNumber={questionNumber} setQuestionNumber={setQuestionNumber}/>}
                </Stack.Screen>
            </Stack.Navigator>
        </NavigationContainer>
    )
    

    function DictionaryScreen ({ route, navigation, userSearchedWord, setUserSearchedWord }) {
        cacheFonts([FontAwesome.font])
        let randomWordSelect = Math.floor(Math.random() * (RandomWords.words.length - 1))
        let [data, setData] = useState([])
        let [loading, setLoading] = useState(false)
        let [randomWord, setRandomWord] = useState("")
        let [randomWordDef, setRandomWordDef] = useState("")
        let [randomWordFL, setRandomWordFL] = useState("")
        let [lookUpWord, setLookUpWord] = useState("")
        async function getWord(word) {
            const apiRes = await fetch(`https://www.dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=dbc7ca9b-28b1-481a-b1c0-798369969a48`);
            const data = await apiRes.json();
            console.log(data)
            setLoading(true)
            setRandomWord(data[0].meta.stems[0])
            setRandomWordDef(data[0].shortdef[0])
            setRandomWordFL(data[0].fl)
        }
        useEffect(() => {
            getWord(RandomWords.words[randomWordSelect])
        }, [])

        const buttonPressed = () => {
            setUserSearchedWord(lookUpWord)
            navigation.navigate('Search Results', {userSearchedWord})
        }
        let inputWord = ""
        return (
        <View style={[styles.containerMain]}>
            <View style={[styles.container]}>
                <Input style={[styles.searchBar]} leftIcon={{ type: 'font-awesome', name: 'search' }} onChangeText={(textInput) => setLookUpWord(textInput)} value={lookUpWord} placeholder="Enter word to search for"></Input>
                <Button style={[styles.button]} title="Search" onPress={() => buttonPressed()} />
            </View>
            <Text style={[styles.WordHeader]}>Random Word</Text>
            <View style={[styles.WordBox]}>
                <Text style={[styles.Word]}>{randomWord}</Text>
                <Text style={[styles.WordFL]}>{randomWordFL}</Text>
                <Text style={[styles.WordDef]}>{randomWordDef}</Text>
            </View>
            <Button title="Play Matching Game" onPress={() => navigation.navigate('Matching Game')} />
        </View>
        )
    }
    function SearchResultsScreen ({ route, navigation, userSearchedWord, setUserSearchedWord }) {
        cacheFonts([FontAwesome.font])
        let [data, setData] = useState([])
        let [loading, setLoading] = useState(false)
        let [searchWord, setSearchWord] = useState("")
        let [searchWordDef, setSearchWordDef] = useState("")
        let [searchWordFL, setSearchWordFL] = useState("")
        let [wordSuggestions, setWordSuggestions] = useState([])
        const [selectedIndex, setSelectedIndex] = useState(null)
        function checkData(incoming) {
            console.log("incoming", incoming)
            if (incoming && incoming[0] && incoming[0].hasOwnProperty("fl")) {
                setSearchWord(incoming[0].meta.stems[0])
                setSearchWordDef(incoming[0].shortdef[0])
                setSearchWordFL(incoming[0].fl)
            } else if (incoming[0]) {
                setSearchWord("We didn't find that word in the dictionary, did you mean...")
                setWordSuggestions(incoming)
            } else {
                setSearchWord("Sorry, We didn't find anything close in the dictionary, please try again")
            }
        }
        useEffect(() => {
            fetch(`https://www.dictionaryapi.com/api/v3/references/collegiate/json/${userSearchedWord}?key=dbc7ca9b-28b1-481a-b1c0-798369969a48`)
            .then((response) => response.json())
            .then((json) => checkData(json))
            .catch((error) => console.error(error))
            .finally(() => setLoading(false))

        }, [userSearchedWord])
        let renderItem = ({item}) => {
            return ({item})
        }
        // function reSearchWord(selectedIndex) {
        //     setSelectedIndex(selectedIndex)
        //     setUserSearchedWord(wordSuggestions[selectedIndex])
        //     console.log("you clicked me!")
        // }
        async function reSearchWord(selectedIndex) {
        setSelectedIndex(selectedIndex)
        const apiRes = await fetch(`https://www.dictionaryapi.com/api/v3/references/collegiate/json/${wordSuggestions[selectedIndex]}?key=dbc7ca9b-28b1-481a-b1c0-798369969a48`);
        const data = await apiRes.json();
        console.log(data)
        setLoading(true)
        setSearchWord(data[0].meta.stems[0])
        setSearchWordDef(data[0].shortdef[0])
        setSearchWordFL(data[0].fl)
        setWordSuggestions([])
        }
        return (
        <View style={[styles.container]}>
            <View style={[styles.randomWordBox]}>
                <Text style={[styles.Word]}>{searchWord}</Text>
                <Text style={[styles.WordFL]}>{searchWordFL}</Text>
                <Text style={[styles.WordDef]}>{searchWordDef}</Text>
                <ButtonGroup vertical buttons={wordSuggestions} selectedIndex={selectedIndex} onPress={reSearchWord} />
            </View>
        </View>
        )
    }

    function MatchingGameScreen ({ route, navigation, score, setScore, questionNumber, setQuestionNumber }) {
        let randomWordSelect = []
        let tempWords = []
        for (let i = 0; i < 4; i++) {
            randomWordSelect[i] = Math.floor(Math.random() * (GameWords.words.length - 1))
            tempWords.push(GameWords.words[randomWordSelect[i]])
        }
        let [matchingWords, setMatchingWords] = useState(tempWords)
        let [randomDefinitionSelection, setrandomDefinitionSelection] = useState(Math.floor(Math.random() * 4))
        let [data, setData] = useState([])
        let [loading, setLoading] = useState(false)
        let [matchingDef, setMatchingDef] = useState("")
        let [selectedIndex, setSelectedIndex] = useState(null)
        let [answerFeedback, setAnswerFeedback] = useState("")
        let [nextEnable, setNextEnable] = useState(true)
        let [buttonsEnabled, setButtonsEnabled] = useState(false)
        let isFirstLoad = useRef(true)

        useEffect(() => {
            fetch(`https://www.dictionaryapi.com/api/v3/references/collegiate/json/${matchingWords[randomDefinitionSelection]}?key=dbc7ca9b-28b1-481a-b1c0-798369969a48`)
            .then((response) => response.json())
            .then((json) => checkData(json))
            .catch((error) => console.error(error))
            .finally(() => setLoading(false))
            console.log(matchingWords[randomDefinitionSelection])
        }, [])
        useEffect(() => {
            if (!isFirstLoad.current) {
                checkAnswer()
            } else {
                isFirstLoad.current = false   
            }
        }, [selectedIndex])
        function checkData(incoming) {
            console.log("randomDefinitionSelection", randomDefinitionSelection)
                setMatchingDef(incoming[0].shortdef[0])
        }
        const checkAnswer = () => {
            console.log("selectedIndex", selectedIndex)
            console.log("randomDefinitionSelection", randomDefinitionSelection)
            setButtonsEnabled(true)
            if (selectedIndex == randomDefinitionSelection) {
                setAnswerFeedback("Correct!")
                setNextEnable(false)
                console.log("correct")
            } else {
                setAnswerFeedback("Incorrect, the correct answer is: " + matchingWords[randomDefinitionSelection])
                setNextEnable(false)
                console.log("incorrect")
            } 
        }
        const nextQuestion = () => {
            if (answerFeedback == "Correct!") {
                setScore(score+1)
            }
            setQuestionNumber(questionNumber+1)
            if (questionNumber >= 4) {
                navigation.navigate('Summary')
            } else {
                navigation.navigate('Matching Game')
            }
        }
        return (
        <View style={[styles.container]}>
            <Text style={[styles.gameInstructions]}>Select the word that matches the definition:</Text>
            
            <Text style={[styles.gameInfo]}>Question {questionNumber+1} of 5</Text>
            <Text style={[styles.gameInfo]}>Score: {score} out of a possible {questionNumber}</Text>
            <View style={[styles.container]}>
                <Text style={[styles.gameDef]}>Definition: {matchingDef}</Text>
            </View>
            <ButtonGroup buttonStyle={{ margin: 20 }} vertical buttons={matchingWords} selectedIndex={selectedIndex} onPress={setSelectedIndex} disabled={buttonsEnabled} />
            <Button title={questionNumber == 4 ? "See Summary" : "Next Question"} onPress={nextQuestion} disabled={nextEnable} />
            <Text style={answerFeedback == "Correct!" ? styles.answerCorrect : styles.answerIncorrect}>{answerFeedback}</Text>
        </View>
        )
    }

    function SummaryScreen({ route, navigation, score, setScore, questionNumber, setQuestionNumber }) {
        const playAgain = () => {
            setScore(0)
            setQuestionNumber(0)
            navigation.navigate('Matching Game')
        }
        const quit = () => {
            setScore(0)
            setQuestionNumber(0)
            navigation.navigate('Dictionary')
        }
        return (
            <View style={[styles.container]}>
                <Text style={[styles.apptitle]}>Score: {score}/5</Text>
                <View style={[styles.horizontal]}>
                    <Button style={[styles.buttons]} title="Play Again" onPress={playAgain} />
                    <Button style={[styles.buttons]} title="Quit" onPress={quit} />
                </View>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    horizontal: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 10,
    },
    containerMain: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'top',
        marginTop: 40,
    },
    container: {
        alignItems: 'center',
        justifyContent: 'top',
        margin: 40,
    },
    WordBox: {
        backgroundColor: '#ccc',
        alignItems: 'left',
        justifyContent: 'center',
        margin: 10,
        padding: 30,
    },
    WordHeader: {
        fontSize: 35,
        fontWeight: "bold",
        textAlign: "center",
        marginTop: 75,
    },
    Word: {
        fontSize: 40,
        fontWeight: "bold",
    },
    WordFL: {
        fontSize: 20,
        fontStyle: "italic",
    },
    WordDef: {
        fontSize: 25,
        fontWeight: "bold",
    },
    searchBar: {
        fontSize: 20,
        paddingLeft: 20,
        paddingRight: 20,
    },
    buttons: {
        width: 150,
        marginHorizontal: 15,
    },
    apptitle: {
        color: '#000',
        fontSize: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
    },
    questiontext: {
        color: '#000',
        fontSize: 20,
        fontWeight: 'bold',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 15,
    },
    answerCorrect: {
        color: '#14a622',
        fontSize: 20,
        fontWeight: 'bold',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 15,
    },
    answerIncorrect: {
        color: '#c42018',
        fontSize: 20,
        fontWeight: 'bold',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 15,
    },
    gameInfo: {
        color: '#000',
        fontSize: 20,
        fontWeight: 'bold',
        alignItems: 'center',
        justifyContent: 'center',
    },
    gameInstructions: {
        color: '#000',
        fontSize: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    gameDef: {
        color: '#000',
        fontSize: 20,
        fontWeight: 'bold',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 30,
    },
    answerBold: {
        color: '#000',
        fontSize: 17,
        fontWeight: 'bold',
        alignItems: 'center',
        justifyContent: 'center',
    },
    answersNormal: {
        color: '#000',
        fontSize: 17,
        alignItems: 'center',
        justifyContent: 'center',
    },
    answerStrike: {
        color: '#000',
        fontSize: 17,
        textDecorationLine: "line-through",
        alignItems: 'center',
        justifyContent: 'center',
    }
})