using UnityEngine;
using System.Collections;

public class WormControl : MonoBehaviour {

	public float speed = 0.4f;
	public float minSpeed = 0.1f;
	private float direction = 0f;
	public AudioClip[] splatSounds;

	public bool isBigWorm = false;
	public GameObject smallWorm;
	public float spawnOffspringDelay = 1.5f;

	private AudioSource audioSource;
	public bool inWater = true;

	public Sprite splatSprite;
	public ParticleSystem spawnParticle;

	// Use this for initialization
	void Start () {
		direction = Random.Range (0, 360);
		speed = Random.Range (minSpeed, speed);
		transform.Rotate(new Vector3(0f, 0f, direction));
		}

	// Update is called once per frame
	void Update () {
		//move in direction
		transform.position -= transform.right * Time.deltaTime * speed;
	}

	void OnTriggerExit2D(Collider2D coll){
		if (coll.gameObject.name == "WaterCollider") {
			//Debug.Log ("LEFT THE WATER");
			inWater = false;
		}

		if (coll.gameObject.name == "Exit") {
			//Debug.Log ("LEFT THE TOILET");
			UnityEngine.SceneManagement.SceneManager.LoadScene ("GameOver", UnityEngine.SceneManagement.LoadSceneMode.Additive);
			GameObject.Find("Control").GetComponent<GasStationControl>().gameRunning = false;
			//pause the game
			Time.timeScale = 0;
		}
	}

	void OnTriggerEnter2D(Collider2D coll) {
		if (coll.gameObject.name == "PooPrefab(Clone)" && inWater == false) {
			Globals.score += 1;

			//sound
			audioSource = GetComponent<AudioSource> ();
			audioSource.clip = splatSounds[Random.Range(0, splatSounds.Length)];
			if (Globals.sound){
				audioSource.Play ();
			}

			//poo splatter
			ParticleSystem pooSplatParticleSys = Instantiate (coll.gameObject.GetComponent<PooControl>().pooSplatParticle, transform.position, Quaternion.identity) as ParticleSystem;
			pooSplatParticleSys.Play ();

			//swap poo to splat sprite
			coll.GetComponent<SpriteRenderer>().sprite = splatSprite;

			//turn off bug sprite on this
			GetComponent<SpriteRenderer>().enabled = false;

			speed = 0f;

			if (isBigWorm == true) {
				Invoke ("spawnTwoWorms", spawnOffspringDelay);
				Debug.Log ("BIG WORM");
			} else {
				Globals.tempGameBugsKilled += 1;
				Debug.Log ("LITTLE WORM");
			}

			Destroy (this.gameObject, spawnOffspringDelay);

		}
	}

	void spawnTwoWorms(){
		//play a gross green particle effect
		ParticleSystem spawnParticleSys = Instantiate (spawnParticle, transform.position, Quaternion.identity) as ParticleSystem;
		spawnParticleSys.Play ();

		GameObject wormone = Instantiate (smallWorm, new Vector3 (transform.position.x, transform.position.y, -1f), Quaternion.identity) as GameObject;
		GameObject wormtwo = Instantiate (smallWorm, new Vector3 (transform.position.x, transform.position.y, -1f), Quaternion.identity) as GameObject;

		wormone.GetComponent<WormControl> ().inWater = false;
		wormtwo.GetComponent<WormControl> ().inWater = false;
	}
}