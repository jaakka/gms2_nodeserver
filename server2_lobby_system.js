let dgram = require("dgram");
const { stringify } = require("querystring");
let data;
let server = dgram.createSocket("udp4");

let lastId = 0; //viimeksi annettu asiakkaan tunnus
let lastLobby = 0; // viimeksy annettu aulan tunnus

let aulat = [];  //[pl1,pl2,pl3,pl4,private,id]  jos yksityinen eka on luonnollisesti omistaja
let pelaajat = [];  //[id,nimi,aulanid,pong,ping,x,y,skin]

console.log("Palvelin on aloitettu! ja valmiina toimimaan.");

function etsi_pelaaja_id(abc)
{
    if(pelaajat.length>0) // tarkistetaan ettei oo tyhjä lista
    {
        found=-20;
        i=0;
        while(i<pelaajat.length)
        {
            if(pelaajat[i][0]==abc)
            {
                found = i; // palauttaa missä kohtaa pelaaja on pelaaja listalla
            }
            i++;
        }
        return found;
    }
}

function etsi_aula_idlla(id)
{
    let vastaus = -1;
    let i=0;
    while(i<aulat.length)
    {
        if(aulat[i][5] == id)
        {
            vastaus = i;
        }
        i++;
    }
    return vastaus;
}

function luo_aula(luoja,yksityinen)
{
    console.log("Aula luotiin asetuksilla , omistajaId:"+String(luoja)+" OnkoYksityinen:"+String(yksityinen));
    let uusi_aula = [luoja,-1,-1,-1,yksityinen,lastLobby];
    lastLobby++;
    aulat.push(uusi_aula);
    return (aulat.length-1);//palautetaan uuden aulan index
}

function poista_henkilo_aulasta(user)
{
    i=0;
    while(i<aulat.length)
    {
        if(aulat[i][0] == user){ aulat[i][0]=-1;} //aulan johtaja poistui
        if(aulat[i][1] == user){ aulat[i][1]=-1;} //aulan 2 pelaaja poistui
        if(aulat[i][2] == user){ aulat[i][2]=-1;} //aulan 3 pelaaja poistui
        if(aulat[i][3] == user){ aulat[i][3]=-1;} //aulan 4 pelaaja poistui
        if(aulat[i][0] == -1 && aulat[i][1] == -1 && aulat[i][2] == -1 && aulat[i][3] == -1)
        {
            //jos aula on tyhjä räjäytetään se
            aulat.splice(i, 1); // 2 kohta tarkoittaa että poistetaan vain 1
        }

        i++;
    }
}

function onko_jo_aulassa(kayttaja)
{
    
    if(aulat.length>0)
    {
        //auloja on 
        b=0;
        oliko=false;
        let mis = -1;
        while(b<aulat.length)
        {
            if(aulat[b][0]==kayttaja){oliko=true;} //käyttäjä oli aulassa B 1 paikalla
            if(aulat[b][1]==kayttaja){oliko=true;} //käyttäjä oli aulassa B 2 paikalla
            if(aulat[b][2]==kayttaja){oliko=true;} //käyttäjä oli aulassa B 3 paikalla
            if(aulat[b][3]==kayttaja){oliko=true;} //käyttäjä oli aulassa B 4 paikalla
            if(oliko==true)
            {
                mis = aulat[b][5]; //palautetaan id
                b=aulat.length; //lopetetaan looppi
            }
        b++;
        }
        if(oliko==false)
        {
            //käyttäjä ei ollut aulassa joten hänelle etsitään sellainen
            return etsi_aula_jossa_tilaa(kayttaja);
        }
            else
        {
            return mis; //palautetaan missä hän oli
        }
    }
        else
    {
        return etsi_aula_jossa_tilaa(kayttaja); //luodaan täällä aula koska niitä ei ollut
    }
}

function etsi_aula_jossa_tilaa(etsija)
{
    kohde_aula = -1;
    if(aulat.length>0)
    {
        x=0;
        let mika = -1;
        while(x<aulat.length)
        {
            if(aulat[x][4]==false) //tarkistetaan ettei ole yksityinen aula
            {
                if(aulat[x][0]==-1)
                {
                    aulat[x][0]=etsija;
                    mika = x; //palautetaan aulan index
                    x=aulat.length; //pysäytetään looppi
                    //asetetaan etsijä aulan 1 paikalle
                    //yleensä 1 paikka on varattu mutta jos luoja onkin poistunut
                }
                    else if(aulat[x][1]==-1)
                    {
                        aulat[x][1]=etsija;
                        mika = x; //palautetaan aulan index
                        x=aulat.length; //pysäytetään looppi
                        //asetetaan etsijä aulan 2 paikalle
                    }
                        else if(aulat[x][2]==-1)
                        {
                            aulat[x][2]=etsija;
                            mika = x; //palautetaan aulan index
                            x=aulat.length; //pysäytetään looppi
                            //asetetaan etsijä aulan 3 paikalle
                        }
                            else if(aulat[x][3]==-1)
                            {
                                aulat[x][3]=etsija;
                                mika = x; //palautetaan aulan index
                                x=aulat.length; //pysäytetään looppi
                                //asetetaan etsijä aulan 4 paikalle
                            }
            }
            x++;
        }
        if(mika == -1)
        {
            kohde_aula=luo_aula(etsija,false); //luodaan julkinen aula
            //koska vapaita paikkoja ei ollut
        }
            else
        {
            kohde_aula = mika; //aula löytyi
        }
    }
        else
    {
        console.log("Auloja ei ollut joten luotiin sellainen");
        //auloja ei ollut joten luodaan sellainen
        kohde_aula=luo_aula(etsija,false); //luodaan julkinen aula
    }
    return aulat[kohde_aula][5]; //palautetaan aula mihin liityttiin
}

server.on("message" , function(msg, rinfo){
    data = JSON.parse(msg); //puretaan json
   // console.log(data);
    if(data.id==-1)
    {
        server.send(JSON.stringify({"newid": lastId}),rinfo.port,rinfo.address);
        console.log("Uudelle asiakkaalle '"+String(data.onlineName)+"' annettu tunnus "+String(lastId));
        pelaajat.push([lastId,data.onlineName,-1,0,0,0,0,0]); //lisätään listalle
        lastId+=1; //päivitetään id seuraavalle asiakkaalle
    }
        else
    {
        if(pelaajat.length>0) // kaatu yhdellä pelaajalla ilman
        {
            etsitty = etsi_pelaaja_id(data.id);
            if(etsitty!=-20)
            {
                if(pelaajat[etsitty][3] == data.pong)
                {
                    pelaajat[etsitty][4]=0; // nollataa viive
                }
                pelaajat[etsitty][5]=data.x;
                pelaajat[etsitty][6]=data.y;
                pelaajat[etsitty][7]=data.skin;
                //jos pelaajalla on profiili

                if(data.lobby==-2)
                {
                    pelaajat[etsitty][2] = onko_jo_aulassa(data.id);
                }
                if(data.lobby==-3)
                {
                    poista_henkilo_aulasta(pelaajat[etsitty][0]);
                    pelaajat[etsitty][2] = -1;
                }
                if(pelaajat[etsitty][2]>=0)
                {
                    let aulajossaollaan = etsi_aula_idlla(pelaajat[etsitty][2]); //palauttaa aulan indeksin
                    let pl1 =-1;
                    let pl2 =-1; 
                    let pl3 =-1;
                    let pl4 =-1;
                    if(aulajossaollaan != -1) 
                    {
                        let pl1_test = etsi_pelaaja_id(aulat[aulajossaollaan][0]);
                        if(pl1_test!=-20){pl1 = pelaajat[pl1_test][7];}
                        
                        let pl2_test = etsi_pelaaja_id(aulat[aulajossaollaan][1]);
                        if(pl2_test!=-20){pl2 = pelaajat[pl2_test][7];}

                        let pl3_test = etsi_pelaaja_id(aulat[aulajossaollaan][2]);
                        if(pl3_test!=-20){pl3 = pelaajat[pl3_test][7];}

                        let pl4_test = etsi_pelaaja_id(aulat[aulajossaollaan][3]);
                        if(pl4_test!=-20){pl4 = pelaajat[pl4_test][7];}
                    }
                    server.send(JSON.stringify({"ping":pelaajat[etsitty][4], "lobby":pelaajat[etsitty][2],"pl1":pl1, "pl2":pl2, "pl3":pl3, "pl4":pl4}),rinfo.port,rinfo.address);
                }
                    else
                {
                    server.send(JSON.stringify({"ping":pelaajat[etsitty][4], "lobby":pelaajat[etsitty][2],"pl1":-1, "pl2":-1, "pl3":-1, "pl4":-1}),rinfo.port,rinfo.address);
                }
            }
        }
    }
        
});

function viive()
{
    i=0; 
    setTimeout(viive, 10); //1ms
    while(i<pelaajat.length)
    {
        pelaajat[i][4]++;
        if(pelaajat[i][4]>500)
        {
            console.log(String(pelaajat[i][1])+" yhteys katkesi."); //asiakas potkitaan ulos
            let poistuja = pelaajat[i][0];
            pelaajat.splice(i, 1); // 2 kohta tarkoittaa että poistetaan vain 1
            poista_henkilo_aulasta(poistuja); //poistetaan mahdollisista auloista
        }
        i+=1;
    }
        //console.log(pelaajat);
        console.log(aulat);
}
viive();


server.bind(8080);