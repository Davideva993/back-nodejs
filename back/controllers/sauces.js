const Sauce = require('../models/Sauce');
const fs = require('fs');

const test = (item) => {
console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",item)
}
exports.createSauce = (req, res, next) => {
 
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;

  const sauce = new Sauce({
    ...sauceObject,
  imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });
  sauce.save()
    .then(() => res.status(201).json({ message: 'Objet enregistré !'}))
    .catch(error => res.status(400).json({ error }));
};

exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file ?
    {
      ...JSON.parse(req.body.sauce),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };
  Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
    .then(() => res.status(200).json({ message: 'Objet modifié !'}))
    .catch(error => res.status(400).json({ error }));
};

exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then(sauce => {
      const filename = sauce.imageUrl.split('/images/')[1];
      fs.unlink(`images/${filename}`, () => {
        Sauce.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Objet supprimé !'}))
          .catch(error => res.status(400).json({ error }));
      });
    })
    .catch(error => res.status(500).json({ error }));
};

exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then(sauce => {

      res.status(200).json(sauce)
    })
    .catch(error => res.status(404).json({ error }));
};

exports.getAllSauces = (req, res, next) => {
  Sauce.find()
    .then(sauces => res.status(200).json(sauces))
    .catch(error => res.status(400).json({ error }));
};

exports.likeSauce = (req, res, next) => {
  
 const sauceId = req.params.sauceId
 const userId = req.body.userId
 const userIntention = req.body.like
 
 Sauce.findOne({ _id: sauceId })
    .then(sauce => {
    //l'utilisateur veut liker une sauce 2 fois?
      if(userIntention==1){ 
        if(sauce.usersLiked.includes(userId)){
          return res.status(401).json({ error: "Vous ne pouvez pas liker une sauce plus d'une fois" })
        }
          sauce.likes++;
          sauce.usersLiked.push(userId)
    //l'utilisateur veut disliker une sauce 2 fois?
      }else if (userIntention==-1) {
        if(sauce.usersDisliked.includes(userId)){
          return res.status(401).json({ error: "Vous ne pouvez pas disliker une sauce plus d'une fois" })
        }
        sauce.dislikes++;
        sauce.usersDisliked.push(userId)
        //l'utilisateur retire son like ou retire son dislike (avis retiré)
      }else { 
        const dislikesIndex=sauce.usersDisliked.indexOf(userId)
        const likesIndex=sauce.usersLiked.indexOf(userId)
        if(dislikesIndex>-1){//l'utilisateur retire son dislike?
          sauce.dislikes--;
          sauce.usersDisliked.splice(dislikesIndex, 1)
        }
        else if (likesIndex>-1){//l'utilisateur retire son like?
          sauce.likes--;
          sauce.usersLiked.splice(likesIndex, 1)
        }
        else { //cas non prévu
          return res.status(401).json({ error: "Vous n'avez jamais liké ou disliké cette sauce" })
        }
      }
      
      Sauce.updateOne({ _id: sauceId }, sauce)
      .then(() => res.status(200).json({ message: 'Objet modifié !'}))
      .catch(error => res.status(400).json({ error }));
      
    })
    .catch(error => res.status(404).json({ error }));

};
