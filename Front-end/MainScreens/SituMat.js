import React from 'react';
import { AsyncStorage, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import api from '../Networking/Api';
import MainScreen from './MainScreen';
import DeleteMat from './DeleteMat';
import Notas from './Notas';

export default class SituMat extends React.Component {

  constructor(props){
    super(props);
    this.state = {
        nome: 'Carregando',
        notas: false,
        faltas: false,
        nvlFaltas: 'Aceitável',
        id: null,
        materia: {},
        av: null,
        inputNota: null,
        isLoading: true,
        enum: {
          'ab1': 1,
          'ab2': 2,
          'reav': 3,
          'final': 4
        }
    }
  }

  static navigationOptions = {
    title: 'DADOS DA MATÉRIA',
  };

  componentDidMount(){
    //this.setState({id : this.props.navigation.getParam('id', null)});
    this.getMateria(this.props.navigation.getParam('id', null));
  }

  getMateria = async (id) =>{
    try{
      const url = '/materias/'+id; 
      const response = await api.get(url);
      const materia = response.data;
      //alert("Teste de retorno de uma materia especifica:\n" + JSON.stringify(materia));
      this.setState({
          materia: materia[0],
          isLoading: false,
          nome: materia.nome
      });
      //alert("Teste de retorno de uma materia especifica:\n" + JSON.stringify(this.state.materia));
    }catch (response){
      alert("Erro no GET");
    }
  }

  updateMateria = async (materia) => {
    try{
      this.setState({ isLoading: true });
      let token =  await AsyncStorage.getItem("@GerenciadorUniversitario:token");
      const auth = 'JWT ' + token;
      //console.warn(token);
      const response = await api.put('/materias/'+this.state.materia.id, materia, { headers:{'Authorization' : auth } });
      //alert("Materia atualizada!");
      this.getMateria(this.state.materia.id);
    }catch (response){
      alert("Erro ao adicionar!");
    }
   }

   addFalta = () => {
       m = this.state.materia;
       f = m.faltas;
       m.faltas = Number.parseInt(f + 1);
       this.setState({
            materia: m ,
            faltas: false,
            nvlFaltas: this.nvlFaltas(m),
       });
       this.updateMateria(this.state.materia);
   }

   setNota = (nota, tipo) => {
    if(nota > 10 || nota < 0)
      alert("Notas entre 0 e 10 apenas!")
    else{
      m = this.state.materia;
      m[tipo] = Number.parseFloat(nota);
      m.media = this.calcMedia(m, this.state.enum[tipo]);
      m.conceito = this.conceito(m.media, this.state.enum[tipo])
      //console.warn(m.media + "  "+ tipo+": " + m[tipo])
      this.setState({
          materia: m ,
          notas: false
      });
      //this.updateMateria(this.state.materia);
  }}

  calcMedia = (m, tipo) => {
    ab1 = Number.parseFloat(m.ab1)
    ab2 = Number.parseFloat(m.ab2)
    r = Number.parseFloat(m.reav)
    f = Number.parseFloat(m.final)
    media = Number.parseFloat( (ab1 + ab2) /2)

    if (tipo >= 3)
      if(ab1 < ab2 && ab2 < r)
        media = Number.parseFloat ((r + ab2) /2)

      if(ab2 < ab1 && ab2 < r)
        media = Number.parseFloat((ab1 + r)/2)

    if(tipo === 4)
      media = Number.parseFloat( ((0.6*media) + (0.4*f))/2 )

    return media;
  }

  conceito = (media, tipo) => {
    if (media >= 7)
      return "Aprovado"

    if(media < 5 && tipo >= 2)
      return "Reprovado"

    if (media >= 5.5 && tipo === 4)
      return "Aprovado"

    if(media <= 5.5 && tipo === 4)
      return "Reprovado"

    if(this.state.nvlFaltas === "Limite Ultrapassado")
      return "Reprovado por Falta!"

    return "Matriculado"
          
  }

  nvlFaltas = (m) => {
    nvl = Number.parseFloat(m.faltas/m.max_faltas)
    if(nvl < 0.5)
      return "Aceitável"
    else if (nvl >=  0.5 && nvl < 0.8)
      return "Perigoso"
    else if (nvl >= 0.8 && nvl <=1)
      return "Crítico!"
    else
      return "Limite Ultrapassado"
  }

  render() {
    if(this.state.isLoading)
    return (
      <View style={{paddingVertical: 20, borderTopWidth: 1}}>
      <ActivityIndicator 
      animating 
      size = 'large'
      color='#000000'
      /></View>
    );

    return(
        <View style={{alignItems: 'center', justifyContent: 'center', flex: 1}}>
        <View >
            <Text style={{ fontWeight: 'bold', fontSize: 25, textAlign: 'center',}}>
            {`${this.state.materia.nome}\n${this.state.materia.faltas}\n${this.state.materia.ab1}
            \n${this.state.materia.ab2}\n${this.state.materia.reav}\n${this.state.materia.final}\n\n\n`}</Text>
            
            
        <Text></Text>

        <Text>{`\n\nMÉDIA: ${this.state.materia.media}`}</Text> 
        <Text>{`\n\nCONCEITO: ${this.state.materia.conceito}`}</Text>    
        <Text>{`\n\nNível de Faltas: ${this.state.nvlFaltas}`}</Text>  
      </View>

        <TouchableOpacity
        onPress={() => {this.setState({ faltas: true})}}>
            <View><Text>Adicionar Faltas</Text></View>
        </TouchableOpacity>

        <TouchableOpacity
        onPress={() => {this.setState({ notas: true})}}>
            <View><Text>Adicionar Notas</Text></View>
        </TouchableOpacity>

        <DeleteMat 
        visible = {this.state.faltas}
        onCancel = {() => {this.setState({ faltas: false})}}
        delete = {this.addFalta}
        txt= {'DESEJA ADICIONAR UMA FALTA NESSA MATÉRIA?'}
        //id = {this.state.longSelect}
        dNome = {this.state.materia.nome}
        greenButton = 'Adicionar'
        />

        <Notas
        visible = {this.state.notas}
        onCancel = {() => {this.setState({ notas: false})}}
        //selectedAv = {(value) => { this.teste(value) }}
        selectedAv = {(value) => { this.setState({ av: value }) }}
        setNota = {this.setNota}
        />

        </View>
    );
  }
}


