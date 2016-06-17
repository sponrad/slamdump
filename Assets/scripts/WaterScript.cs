using UnityEngine;
using System.Collections;

public class WaterScript : MonoBehaviour {

	public ParticleSystem splashParticle;


	// Use this for initialization
	void Start () {
	
	}
	
	// Update is called once per frame
	void Update () {
	
	}

	void OnTriggerEnter2D(Collider2D coll) {
		Debug.Log ("poo collider fired");
		Debug.Log (coll.gameObject.name);
		if (coll.gameObject.name == "PooPrefab(Clone)") {
			Debug.Log ("water poo collide");
		}
	}

}
