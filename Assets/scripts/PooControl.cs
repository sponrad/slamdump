using UnityEngine;
using System.Collections;

public class PooControl : MonoBehaviour {

	public float lifeTime = 2.5f;
	public float speed = 2f;
	public Vector3 target;
	public AudioClip[] spawnSounds;
	public ParticleSystem pooSplatParticle;
	public Sprite[] pooSprites;

	private AudioSource audioSource;

	void Start () {
		//not a collider while flying across the screen
		GetComponent<CircleCollider2D> ().enabled = false;

		//pick one of the sprites
		GetComponent<SpriteRenderer> ().sprite = pooSprites[Random.Range(0, pooSprites.Length)];

		audioSource = GetComponent<AudioSource> ();

		//play a sound!
		audioSource.PlayOneShot(spawnSounds[Random.Range(0, spawnSounds.Length)]);

		//destroy at end
		Invoke("Destroy", lifeTime);
	}
	
	void Update () {
		//normall not a collider in final resting state
		GetComponent<CircleCollider2D> ().enabled = false;

		if (transform.position != target) {
			transform.position = Vector3.MoveTowards (transform.position, target, speed * Time.deltaTime);

			if (transform.position == target) {
				//set this after reaching destination, become a collider for a time!
				GetComponent<CircleCollider2D> ().enabled = true;
			}
		}
	}

	void Destroy(){
		Destroy (this.gameObject);
	}

	void OnTriggerEnter2D(Collider2D coll) {
		if (coll.gameObject.name == "WaterCollider") {
			Debug.Log ("water poo collide");
		}
		else if (coll.gameObject.tag == "Enemy") {
			//sound
			audioSource = GetComponent<AudioSource> ();
			//audioSource.clip = splatSounds[Random.Range(0, splatSounds.Length)];
			//audioSource.Play ();
		}
	}

}
